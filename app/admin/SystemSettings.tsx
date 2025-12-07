"use client"

export default function SystemSettings() {
  return (
    <div className="space-y-6">
      {/* Main settings card */}
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <p className="text-6xl mb-4">⚙️</p>
        <h2 className="text-2xl font-bold text-foreground mb-2">System Settings</h2>
        <p className="text-muted-foreground mb-6">Advanced system configuration will be available soon</p>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">Status: </span>
          <span className="inline-flex h-2 w-2 rounded-full bg-success animate-pulse"></span>
          <span className="text-sm font-medium text-success">System Online</span>
        </div>
      </div>

      {/* Coming soon sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-6 opacity-50">
          <p className="text-2xl mb-2">🔐</p>
          <h3 className="font-semibold text-foreground mb-1">Security Settings</h3>
          <p className="text-sm text-muted-foreground">Coming soon</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 opacity-50">
          <p className="text-2xl mb-2">📧</p>
          <h3 className="font-semibold text-foreground mb-1">Email Configuration</h3>
          <p className="text-sm text-muted-foreground">Coming soon</p>
        </div>
      </div>
    </div>
  )
}
