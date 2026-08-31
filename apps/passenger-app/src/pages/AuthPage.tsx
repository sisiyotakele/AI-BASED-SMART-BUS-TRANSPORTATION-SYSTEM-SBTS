import React from "react";
import { useSearchParams } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";

/**
 * AuthPage — unified authentication page.
 * Renders LoginPage or RegisterPage based on ?mode= query param.
 * e.g. /auth?mode=login  → LoginPage
 *      /auth?mode=register → RegisterPage
 * Defaults to LoginPage if no mode is specified.
 */
export const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");

  if (mode === "register") {
    return <RegisterPage />;
  }

  return <LoginPage />;
};

export default AuthPage;
