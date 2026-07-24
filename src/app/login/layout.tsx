// The login page uses the root layout's html/body shell.
// This layout only provides the full-screen centering wrapper.
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
