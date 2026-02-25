import AuthCard from "../components/AuthCard"
import Input from "../components/Input"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <AuthCard
        title="Private Access"
        subtitle="Enter your credentials to continue."
      >
        <form className="space-y-6">
          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
          />

          <button
            type="submit"
            className="w-full bg-white text-black py-3 uppercase tracking-widest text-sm hover:bg-neutral-200 transition-all duration-300"
          >
            Enter
          </button>
        </form>
      </AuthCard>
    </div>
  )
}