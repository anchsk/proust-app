# proust-app

Web interface for [proust-rag](https://github.com/anchsk/proust-rag): ask questions about Proust's *Du côté de chez Swann* in French, English or other languages, and get answers built from quotes in the original French text.

**Live:** [https://proust-app.vercel.app](https://proust-app.vercel.app)

The retrieval, evaluation and documented findings live in [proust-rag](https://github.com/anchsk/proust-rag); the text preparation and indexing in [proust-pipeline](https://github.com/anchsk/proust-pipeline). This repo is only the frontend.

**Stack:** Next.js, shadcn/ui, AI Elements

## Run locally

```sh
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

## Example

**Query:** `Swann's jealousy`

**Answer:**     
Based on the provided context, Swann's jealousy is portrayed as a destructive and all-consuming force that fundamentally transforms his character and perception of the world.

Nature of Swann's Jealousy
The text describes jealousy as composed of « une infinité d'amours successifs, de jalousies différentes et qui sont éphémères, mais par leur multitude ininterrompue donnent l'impression de la continuité, l'illusion de l'unité » (ch.2, par.566). These successive, ephemeral jealousies and loves create an illusion of continuity and unity in Swann's emotional life centered on Odette.

See [answer-example.md](answer-example.md) for the full response.
