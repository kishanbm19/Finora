"""
Modular LLM provider layer supporting OpenAI, Gemini, and graceful fallback.
Keeps API keys in environment variables, handles timeouts, and executes tool loops.
"""
import json
import logging
from typing import Any, Callable

from app.core.config import settings
from app.services.financial_tools import OPENAI_TOOLS

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are Finora's AI Financial Assistant.

You help authenticated SME users understand their own financial data.

Use Finora's financial tools whenever a question requires actual financial information.

Never invent financial numbers.

Never assume financial data that has not been provided by Finora's backend.

The backend database is the source of truth.

Only access data belonging to the currently authenticated user.

Explain financial information clearly and concisely.

When useful, compare current and previous periods.

When you identify a significant change, explain the relevant data behind it.

Do not provide definitive legal, tax, investment, or financial-advisory decisions.

If a question cannot be answered using available Finora data, clearly say so.
"""


class BaseLLMProvider:
    def chat(self, user_message: str, tool_executor: Callable[[str, dict], dict]) -> str:
        raise NotImplementedError


class OpenAIProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        from openai import OpenAI
        self.client = OpenAI(api_key=api_key)
        self.model = model

    def chat(self, user_message: str, tool_executor: Callable[[str, dict], dict]) -> str:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ]

        # First LLM call with tools
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            tools=OPENAI_TOOLS,
            tool_choice="auto",
            timeout=30.0,
        )

        choice = response.choices[0]
        message = choice.message

        # Check if the LLM requested tool execution
        if message.tool_calls:
            # Append assistant message with tool calls
            messages.append(message)

            for tool_call in message.tool_calls:
                fn_name = tool_call.function.name
                try:
                    fn_args = json.loads(tool_call.function.arguments) if tool_call.function.arguments else {}
                except Exception:
                    fn_args = {}

                tool_result = tool_executor(fn_name, fn_args)

                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(tool_result),
                })

            # Second LLM call to get final synthesized response
            second_response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                timeout=30.0,
            )
            return second_response.choices[0].message.content or "No response generated."

        return message.content or "I could not generate an answer."


class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str = "gemini-1.5-flash"):
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        self.model_name = model

    def chat(self, user_message: str, tool_executor: Callable[[str, dict], dict]) -> str:
        import google.generativeai as genai
        
        # Determine relevant tools based on query and execute to provide grounding
        tool_results = {}
        msg_lower = user_message.lower()
        if any(w in msg_lower for w in ["spend", "expense", "cost"]):
            tool_results["monthly_expenses"] = tool_executor("get_monthly_expenses", {})
            tool_results["top_expense_categories"] = tool_executor("get_top_expense_categories", {})
        if any(w in msg_lower for w in ["income", "revenue", "earn"]):
            tool_results["monthly_income"] = tool_executor("get_monthly_income", {})
        if any(w in msg_lower for w in ["balance", "cash", "account", "bank"]):
            tool_results["account_balances"] = tool_executor("get_account_balances", {})
        if any(w in msg_lower for w in ["invoice", "overdue", "outstanding", "receivable"]):
            tool_results["overdue_invoices"] = tool_executor("get_overdue_invoices", {})
            tool_results["invoice_summary"] = tool_executor("get_invoice_summary", {})
        if any(w in msg_lower for w in ["forecast", "future", "project"]):
            tool_results["forecast"] = tool_executor("get_financial_forecast", {"metric": "income"})
        if any(w in msg_lower for w in ["unusual", "anomal", "irregular"]):
            tool_results["anomalies"] = tool_executor("get_anomalies", {})

        if not tool_results:
            tool_results["transaction_summary"] = tool_executor("get_transaction_summary", {})
            tool_results["account_balances"] = tool_executor("get_account_balances", {})

        prompt = f"""{SYSTEM_PROMPT}

USER QUESTION: {user_message}

ACTUAL RETRIEVED FINANCIAL DATA:
{json.dumps(tool_results, indent=2)}

Please answer the user's question clearly based ONLY on the retrieved financial data above.
"""
        model = genai.GenerativeModel(self.model_name)
        response = model.generate_content(prompt)
        return response.text or "I could not generate an answer."


class FallbackToolProvider(BaseLLMProvider):
    """
    Direct tool-executing provider used when LLM API keys are missing or invalid.
    Strictly answers using real database figures without hallucination.
    """
    def chat(self, user_message: str, tool_executor: Callable[[str, dict], dict]) -> str:
        q = user_message.lower()

        # 1. Overdue invoices
        if any(w in q for w in ["overdue", "unpaid invoice", "due invoice"]):
            res = tool_executor("get_overdue_invoices", {})
            invoices = res.get("overdue_invoices", [])
            total = res.get("total_overdue_amount", 0.0)
            if not invoices:
                return "Good news! You have no overdue invoices right now."
            inv_lines = [f"- {inv['invoice_number']} for {inv['customer_name']}: ${inv['amount']:,.2f} (Due: {inv['due_date']})" for inv in invoices[:5]]
            return f"You have {len(invoices)} overdue invoice(s) totaling ${total:,.2f}:\n" + "\n".join(inv_lines)

        # 2. Invoices summary / outstanding receivables
        if any(w in q for w in ["invoice", "receivable", "outstanding"]):
            res = tool_executor("get_invoice_summary", {})
            out_amt = res.get("outstanding_receivables", 0.0)
            out_cnt = res.get("outstanding_count", 0)
            over_amt = res.get("overdue_amount", 0.0)
            return (
                f"You have {out_cnt} outstanding invoice(s) for a total of ${out_amt:,.2f}. "
                f"Of that, ${over_amt:,.2f} is currently overdue."
            )

        # 3. Why did expenses increase / monthly expenses
        if any(w in q for w in ["why did my expenses", "increase", "expense rose", "expenses increase"]):
            exp = tool_executor("get_monthly_expenses", {})
            cats = tool_executor("get_top_expense_categories", {"limit": 3})
            curr = exp.get("expenses", 0.0)
            prev = exp.get("previous_month_expenses", 0.0)
            chg = exp.get("change_amount", 0.0)
            pct = exp.get("change_percentage", 0.0)
            top_list = cats.get("top_categories", [])
            cats_text = ", ".join([f"{c['category']} (${c['amount']:,.2f})" for c in top_list]) if top_list else "general"

            if chg > 0:
                return (
                    f"Your expenses increased by ${chg:,.2f} ({pct}%) compared to last month (${curr:,.2f} vs ${prev:,.2f}). "
                    f"Your largest expense drivers were: {cats_text}."
                )
            elif chg < 0:
                return (
                    f"Your expenses actually decreased by ${abs(chg):,.2f} ({abs(pct)}%) compared to last month "
                    f"(${curr:,.2f} vs ${prev:,.2f}). Top expenses were: {cats_text}."
                )
            else:
                return f"Your expenses remained steady at ${curr:,.2f} this month. Top expenses: {cats_text}."

        # 4. Spending / expenses this month
        if any(w in q for w in ["spend", "spent", "expense", "expenses"]):
            exp = tool_executor("get_monthly_expenses", {})
            cats = tool_executor("get_top_expense_categories", {"limit": 3})
            curr = exp.get("expenses", 0.0)
            top_list = cats.get("top_categories", [])
            cats_text = ", ".join([f"{c['category']} (${c['amount']:,.2f})" for c in top_list]) if top_list else ""
            cat_suffix = f" Top categories: {cats_text}." if cats_text else ""
            return f"You have spent ${curr:,.2f} in expenses for period {exp.get('period')}.{cat_suffix}"

        # 5. Revenue / Income
        if any(w in q for w in ["revenue", "income", "earn", "generated", "came into"]):
            inc = tool_executor("get_monthly_income", {})
            curr = inc.get("income", 0.0)
            prev = inc.get("previous_month_income", 0.0)
            pct = inc.get("change_percentage", 0.0)
            return (
                f"You generated ${curr:,.2f} in revenue for period {inc.get('period')} "
                f"({pct:+.1f}% compared to ${prev:,.2f} last month)."
            )

        # 6. Cash balance / Accounts
        if any(w in q for w in ["cash balance", "balance", "account balance", "money in my account"]):
            bals = tool_executor("get_account_balances", {})
            total = bals.get("total_cash_balance", 0.0)
            accts = bals.get("accounts", [])
            acct_lines = [f"- {a['name']} ({a['account_type']}): ${a['balance']:,.2f}" for a in accts]
            details = ("\n" + "\n".join(acct_lines)) if acct_lines else ""
            return f"Your current total cash balance is ${total:,.2f} across {len(accts)} account(s).{details}"

        # 7. Categories
        if any(w in q for w in ["category", "categories", "largest expense"]):
            cats = tool_executor("get_top_expense_categories", {"limit": 5})
            top_list = cats.get("top_categories", [])
            if not top_list:
                return "No expense transactions recorded yet."
            items = [f"{i+1}. {c['category']}: ${c['amount']:,.2f}" for i, c in enumerate(top_list)]
            return "Your largest expense categories are:\n" + "\n".join(items)

        # 8. Forecast
        if any(w in q for w in ["forecast", "future", "predict"]):
            fc = tool_executor("get_financial_forecast", {"metric": "income", "periods_ahead": 3})
            points = fc.get("forecast", [])
            if not points:
                return "There is insufficient transaction history to calculate a reliable forecast."
            p_lines = [f"- {p['period']}: projected ${p['predicted_value']:,.2f}" for p in points]
            return f"Financial forecast (using {fc.get('method')} over {fc.get('history_points_used')} periods):\n" + "\n".join(p_lines)

        # 9. Anomalies
        if any(w in q for w in ["unusual", "anomal", "irregular", "strange"]):
            anom = tool_executor("get_anomalies", {})
            detected = anom.get("anomalies_detected", [])
            if not detected:
                return f"No unusual transactions detected across {anom.get('total_transactions_checked', 0)} checked expense transactions."
            lines = [f"- ${a['amount']:,.2f} in {a['category']}: {a['reason']}" for a in detected[:5]]
            return f"Found {len(detected)} unusual transaction(s):\n" + "\n".join(lines)

        # 10. Cash flow / overall summary
        tx_sum = tool_executor("get_transaction_summary", {"limit": 5})
        bals = tool_executor("get_account_balances", {})
        return (
            f"Here is a summary of your finances:\n"
            f"- Total Revenue: ${tx_sum.get('total_revenue', 0.0):,.2f}\n"
            f"- Total Expenses: ${tx_sum.get('total_expenses', 0.0):,.2f}\n"
            f"- Net Profit: ${tx_sum.get('net_profit', 0.0):,.2f}\n"
            f"- Total Cash Balance: ${bals.get('total_cash_balance', 0.0):,.2f}"
        )


def get_llm_provider() -> BaseLLMProvider:
    """Factory to retrieve the configured LLM provider or fallback."""
    provider_pref = (settings.LLM_PROVIDER or "auto").lower()

    # If OpenAI is preferred or auto-detected with valid key
    if provider_pref in ("openai", "auto") and settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.strip():
        try:
            return OpenAIProvider(api_key=settings.OPENAI_API_KEY.strip(), model=settings.OPENAI_MODEL)
        except Exception as e:
            logger.warning(f"Could not initialize OpenAI provider: {e}")

    # If Gemini is preferred or auto-detected with valid key
    if provider_pref in ("gemini", "auto") and settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
        try:
            return GeminiProvider(api_key=settings.GEMINI_API_KEY.strip(), model=settings.GEMINI_MODEL)
        except Exception as e:
            logger.warning(f"Could not initialize Gemini provider: {e}")

    # Fallback to direct tool execution without hallucination
    return FallbackToolProvider()
