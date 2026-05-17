export default function FeedSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className="skeleton rounded-2xl h-36"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  )
}
