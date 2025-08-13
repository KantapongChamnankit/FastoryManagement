export default function Loading({ theme }: { theme: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px]">
      <img
        src={theme === "dark" ? "/logo_dark.png" : "/logo_light.png"}
        alt="Loading..."
        className="w-24 h-24 mb-4"
        style={{
          opacity: (Math.sin(Date.now() / 500) + 1) / 2,
          transition: "opacity 0.5s ease-in-out",
        }}
      />
      <span className="text-slate-500 text-lg">Loading.</span>
    </div>
  )
}
