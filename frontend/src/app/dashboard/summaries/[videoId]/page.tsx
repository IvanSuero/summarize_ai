import { getSummaryById } from "@/data/loaders";
import { SummaryCardForm } from "@/components/forms/SummaryCardForm";
import { extractYouTubeID } from "@/lib/youtube-transcript";

interface ParamsProps {
  params: {
    videoId: string;
  };
}

export default async function SummaryCardRoute({
  params,
}: Readonly<ParamsProps>) {
   const data = await getSummaryById(params.videoId);
   if (data?.error?.status === 404) return <p>No Items Found</p>;
  const videoId = extractYouTubeID(data.videoId);

  return (
    <SummaryCardForm
      item={data}
      className="w-full"
    />
  );
}