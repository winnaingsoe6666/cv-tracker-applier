import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { CollaboratorsPanel, NotesPanel } from "./collaborate-client";

export default async function CollaboratePage() {
  const user = await requireUser();

  const collaborators = await db.collaboration.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const notes = await db.collabNote.findMany({
    where: { application: { userId: user.id } },
    include: {
      author: { select: { name: true, email: true } },
      application: {
        select: {
          id: true,
          status: true,
          job: { select: { title: true, company: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Collaboration</h1>
        <p className="mt-1 text-sm text-muted">
          Manage team access and review collaborator notes on your applications.
        </p>
      </div>

      <div className="space-y-5">
        <CollaboratorsPanel initial={collaborators} />
        <NotesPanel initial={notes} />
      </div>
    </div>
  );
}
