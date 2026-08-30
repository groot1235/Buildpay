import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="dark min-h-screen bg-background text-foreground flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md space-y-6 flex flex-col items-center">
        <div className="flex items-center gap-2 font-bold text-2xl tracking-tight select-none mb-2">
          <span className="bg-primary text-primary-foreground p-1.5 rounded-md text-sm font-mono">BP</span>
          <span>BuildPay</span>
        </div>
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/dashboard"
          appearance={{
            variables: {
              colorPrimary: "hsl(217.2 91.2% 59.8%)",
              colorBackground: "#1e1e24",
            },
            elements: {
              card: "border border-zinc-800 shadow-xl bg-zinc-900",
              headerTitle: "text-white font-bold",
              headerSubtitle: "text-zinc-400",
              socialButtonsBlockButton: "border-zinc-800 text-white hover:bg-zinc-800",
              formFieldLabel: "text-zinc-300",
              formFieldInput: "bg-zinc-950 border-zinc-800 text-white focus:ring-primary",
              footerActionText: "text-zinc-400",
              footerActionLink: "text-blue-500 hover:text-blue-400",
            }
          }}
        />
      </div>
    </div>
  );
}
