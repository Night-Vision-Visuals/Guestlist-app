import AuthCard from "../components/AuthCard"
import Input from "../components/Input"

export default function ApplyPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 py-20">
      <AuthCard
        title="Event Application"
        subtitle="Limited capacity. Serious requests only."
      >
        <form className="space-y-6">
          <Input label="Full Name" placeholder="Your name" />

          <Input
            label="Instagram"
            placeholder="@username"
          />

          <Input
            label="Why should we let you in?"
            placeholder="Tell us something interesting..."
          />

          <button
            type="submit"
            className="w-full bg-white text-black py-3 uppercase tracking-widest text-sm hover:bg-neutral-200 transition-all duration-300"
          >
            Submit
          </button>
        </form>
      </AuthCard>
    </div>
  )
}