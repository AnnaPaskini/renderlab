import { Background } from "@/components/background";
import { Companies } from "@/components/companies";
import { Container } from "@/components/container";
import { Heading } from "@/components/heading";
import { Pricing } from "@/components/pricing";
import { Subheading } from "@/components/subheading";
import { Metadata } from "next";
import { PricingTable } from "./pricing-table";

export const metadata: Metadata = {
  title: "Pricing - RenderLab",
  description:
    "RenderLab is an AI-powered image generation platform that helps creators, businesses, and developers bring their ideas to life. Generate stunning images, edit photos, and create visual content with advanced AI technology.",
  openGraph: {
    images: [],
  },
};

export default function PricingPage() {
  return (
    <div className="relative overflow-hidden py-20 md:py-0">
      <Background />
      <Container className="flex flex-col items-center justify-between  pb-20">
        <div className="relative z-20 py-10 md:pt-40">
          <Heading as="h1">Simple pricing for your ease</Heading>
          <Subheading className="text-center">
            RenderLab offers a wide range of services. You can choose the one
            that suits your needs. Select from your favourite plan and get
            started instantly.
          </Subheading>
        </div>
        <Pricing />
        <PricingTable />
        <Companies />
      </Container>
    </div>
  );
}
