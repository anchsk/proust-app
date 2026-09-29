"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const REPOS = [
  { name: "proust-pipeline", role: "prepares and indexes the text", href: "https://github.com/anchsk/proust-pipeline" },
  { name: "proust-rag", role: "searches passages and writes answers", href: "https://github.com/anchsk/proust-rag" },
  { name: "proust-app", role: "this interface", href: "https://github.com/anchsk/proust-app" },
];

export function AboutDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">About</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Proust Recherche</DialogTitle>
          <DialogDescription>
            Ask questions about <cite>Du côté de chez Swann</cite>, the first volume of{" "}
            <cite>À la recherche du temps perdu</cite>, in any language. Answers are built from quotes in
            Proust&apos;s original French text rather than from an AI&apos;s general knowledge of the novel.
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-2 text-sm">
          <h3 className="font-medium">How it works</h3>
          <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>
              Your question is matched against the text in two ways: by meaning, and by exact words for
              rarer terms like <em>madeleine</em>.
            </li>
            <li>
              The most relevant passages are sent to Claude, which is instructed to answer only from them
              and to cite the chapter and paragraph.
            </li>
          </ol>
        </section>

        <section className="space-y-2 text-sm">
          <h3 className="font-medium">Good to know</h3>
          <p className="text-muted-foreground">
            Each question is answered on its own. Answers are written by an AI and can contain mistakes.
            Each quote cites its paragraph, so it can be checked. Broad questions (&ldquo;list every
            flower&rdquo;) and counting things across the book aren&apos;t supported yet.
          </p>
        </section>

        <section className="space-y-2 text-sm">
          <h3 className="font-medium">Source code</h3>
          <ul className="space-y-1">
            {REPOS.map((repo) => (
              <li key={repo.name}>
                <a
                  href={repo.href}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline underline-offset-4 hover:text-muted-foreground"
                >
                  {repo.name}
                </a>
                <span className="text-muted-foreground"> — {repo.role}</span>
              </li>
            ))}
          </ul>
        </section>
      </DialogContent>
    </Dialog>
  );
}
