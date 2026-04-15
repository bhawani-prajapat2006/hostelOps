export default function WardenDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-3">
          <div className="skeleton h-9 w-56"></div>
          <div className="skeleton h-4 w-80 max-w-full"></div>
          <span className="loading loading-bars loading-md text-primary"></span>
        </div>
        <div className="skeleton h-12 w-full md:w-64"></div>
      </div>

      {[1, 2, 3].map((item) => (
        <div key={item} className="card bg-base-100 border border-base-300 shadow-sm">
          <div className="card-body gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 w-full">
                <div className="skeleton h-6 w-1/3"></div>
                <div className="skeleton h-4 w-2/3"></div>
              </div>
              <div className="skeleton h-6 w-20 rounded-full"></div>
            </div>

            <div className="skeleton h-4 w-1/2"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="skeleton h-12 w-full"></div>
              <div className="skeleton h-12 w-full"></div>
              <div className="skeleton h-12 w-full"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
