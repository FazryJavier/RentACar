import { FAQ_CATEGORIES } from "@/content/faq";
import { FaqSearch } from "./faq-search";
import { InfoContainer, InfoHeader } from "./prose-page";

export function FaqView() {
  return (
    <InfoContainer className="flex flex-col gap-10">
      <InfoHeader
        title="Pertanyaan yang Sering Diajukan"
        lead="Jawaban singkat tentang pemesanan, pembayaran, pengambilan mobil, serta GPS dan privasi."
      />
      <FaqSearch categories={FAQ_CATEGORIES} />
    </InfoContainer>
  );
}
