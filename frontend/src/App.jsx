import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./app/providers";
import AppRoutes from "./app/routes";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
