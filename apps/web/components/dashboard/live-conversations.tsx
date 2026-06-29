import Link from "next/link";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function LiveConversations({ data }: { data?: { visitor: string; message: string; time: string; online: boolean }[] }) {
  const rows = data ?? [];
  return (
    <section className="rounded-card bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary">Live Conversations</h2>
        <Link className="text-sm font-semibold text-brand" href="/conversations">
          View all →
        </Link>
      </div>
      {rows.length > 0 ? (
        <div className="mt-5 divide-y divide-border">
          {rows.map((conversation, index) => (
            <div className="flex gap-3 py-4 first:pt-0 last:pb-0" key={`${conversation.visitor}-${index}`}>
              <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-brand-light text-xs font-bold text-brand">
                {initials(conversation.visitor)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="truncate text-sm font-semibold text-text-primary">{conversation.visitor}</p>
                  <span className="flex items-center gap-2 whitespace-nowrap text-xs text-text-secondary">
                    {conversation.time}
                    {conversation.online ? <span className="h-2 w-2 rounded-full bg-success" /> : null}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-text-secondary">{conversation.message}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-text-secondary">No conversations yet</p>
      )}
    </section>
  );
}
