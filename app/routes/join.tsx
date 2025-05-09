import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";

import { createUser, getUserByEmail } from "~/models/user.server";
import { createUserSession, getUserId } from "~/session.server";
import { safeRedirect, validateEmail } from "~/utils";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = safeRedirect(formData.get("redirectTo"), "/dashboard");

  if (!validateEmail(email)) {
    return json(
      { errors: { email: "L'adresse email est invalide", password: null } },
      { status: 400 },
    );
  }

  if (typeof password !== "string" || password.length === 0) {
    return json(
      { errors: { email: null, password: "Le mot de passe est requis" } },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return json(
      { errors: { email: null, password: "Le mot de passe doit contenir au moins 8 caractères" } },
      { status: 400 },
    );
  }

  const existingUser = await getUserByEmail(email as string);
  if (existingUser) {
    return json(
      { errors: { email: "Un utilisateur avec cette adresse email existe déjà", password: null } },
      { status: 400 },
    );
  }

  // Note: Nous stockons uniquement l'email et le mot de passe dans cette version simplifiée
  // Pour stocker les informations complètes, il faudrait mettre à jour le schéma Prisma
  const user = await createUser(
    email as string, 
    password as string
  );

  return createUserSession({
    redirectTo,
    remember: false,
    request,
    userId: user.id,
  });
};

export const meta: MetaFunction = () => [{ title: "Inscription | TaskFlow Pro" }];

export default function Join() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const actionData = useActionData<typeof action>();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [passwordStrength, setPasswordStrength] = useState<number>(0);
  
  // Fonction pour évaluer la force du mot de passe
  const evaluatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.match(/[A-Z]/)) strength += 1;
    if (password.match(/[0-9]/)) strength += 1;
    if (password.match(/[^A-Za-z0-9]/)) strength += 1;
    setPasswordStrength(strength);
  };

  useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  return (
    <div className="flex min-h-full flex-col justify-center bg-gradient-to-b from-indigo-50 to-white py-12">
      <div className="mx-auto w-full max-w-md px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-indigo-900">TaskFlow Pro</h1>
          <p className="mt-2 text-gray-600">Créez votre compte pour commencer</p>
        </div>
        <div className="rounded-lg bg-white p-8 shadow-md">
          <Form method="post" className="space-y-6">
          {/* Note: Les champs pour le prénom et le nom ont été retirés car ils ne sont pas dans le schéma Prisma actuel */}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Adresse email
            </label>
            <div className="mt-1">
              <input
                ref={emailRef}
                id="email"
                required
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus={true}
                name="email"
                type="email"
                autoComplete="email"
                aria-invalid={actionData?.errors?.email ? true : undefined}
                aria-describedby="email-error"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {actionData?.errors?.email ? (
                <div className="pt-1 text-sm text-red-600" id="email-error">
                  {actionData.errors.email}
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Mot de passe
            </label>
            <div className="mt-1">
              <input
                id="password"
                ref={passwordRef}
                name="password"
                type="password"
                autoComplete="new-password"
                onChange={(e) => evaluatePasswordStrength(e.target.value)}
                aria-invalid={actionData?.errors?.password ? true : undefined}
                aria-describedby="password-error"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {actionData?.errors?.password ? (
                <div className="pt-1 text-sm text-red-600" id="password-error">
                  {actionData.errors.password}
                </div>
              ) : (
                <div className="mt-2">
                  <div className="flex h-2 w-full overflow-hidden rounded bg-gray-200">
                    <div 
                      className={`h-full ${passwordStrength === 0 ? 'w-0' : 
                        passwordStrength === 1 ? 'w-1/4 bg-red-500' : 
                        passwordStrength === 2 ? 'w-2/4 bg-yellow-500' : 
                        passwordStrength === 3 ? 'w-3/4 bg-blue-500' : 
                        'w-full bg-green-500'}`}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {passwordStrength === 0 ? 'Entrez un mot de passe' : 
                     passwordStrength === 1 ? 'Faible' : 
                     passwordStrength === 2 ? 'Moyen' : 
                     passwordStrength === 3 ? 'Fort' : 
                     'Très fort'}
                  </p>
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">Au moins 8 caractères, incluant majuscules, chiffres et symboles</p>
            </div>
          </div>

          <input type="hidden" name="redirectTo" value={redirectTo} />
          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Créer mon compte
          </button>
          <div className="flex items-center justify-center">
            <div className="text-center text-sm text-gray-500">
              Vous avez déjà un compte?{" "}
              <Link
                className="font-medium text-indigo-600 hover:text-indigo-500"
                to={{
                  pathname: "/login",
                  search: searchParams.toString(),
                }}
              >
                Connexion
              </Link>
            </div>
          </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
