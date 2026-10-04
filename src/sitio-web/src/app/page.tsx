import Hero from "@/components/landing/Hero";
import {
  AcademicOfferSection,
  GallerySection,
  ContactSection
} from "@/components/landing/Sections";
import {
  HistorySection,
  MissionSection,
  VisionSection,
  LevelsSection,
  StatsSection,
  TeachersSection,
  NewsSection,
  RequirementsSection,
  EnrollmentInfoSection,
  ConductSection,
  GradesAccessSection
} from "@/components/landing/Institucional";

export default function HomePage() {
  return (
    <>
      <Hero />
      <NewsSection />
      <HistorySection />
      <MissionSection />
      <VisionSection />
      <AcademicOfferSection />
      <LevelsSection />
      <StatsSection />
      <TeachersSection />
      <GallerySection />
      <RequirementsSection />
      <EnrollmentInfoSection />
      <ConductSection />
      <GradesAccessSection />
      <ContactSection />
    </>
  );
}
