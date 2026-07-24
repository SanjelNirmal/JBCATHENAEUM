// Copyright by nirmal sanjel | hackingwithnirmal@gmail.com | +977 9848744321

import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Upload,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import type { Subject } from "../lib/api";
import { campusImages } from "../content/campusImages";

interface HeroProps {
  onNavigateResources?: () => void;
  onNavigateSemesters?: () => void;
  onNavigateContribute?: () => void;
  onSelectSubject?: (id: string) => void;
  subjects?: Subject[];
  resources?: unknown[];
}

type HeroAction = "resources" | "semesters" | "contribute";
type HeroIcon = "book" | "graduation" | "upload";

interface HeroSlide {
  id: number;
  eyebrow: string;
  title: string;
  highlightedTitle: string;
  description: string;
  image: string;
  imageAlt: string;
  imagePosition: string;
  icon: HeroIcon;
  primaryButton: {
    label: string;
    action: HeroAction;
  };
  secondaryButton: {
    label: string;
    action: HeroAction;
  };
  cardTitle: string;
  cardDescription: string;
  cardBadge: string;
}

const slides: HeroSlide[] = [
  {
    id: 1,
    eyebrow: "Jana Bhawana Campus",
    title: "TU BCA and BICTE",
    highlightedTitle: "resources, organized.",
    description:
      "Search reviewed notes, project reports, PDFs, past questions, and learning materials prepared for Jana Bhawana Campus students.",
    image: campusImages.campusBuilding.src,
    imageAlt: campusImages.campusBuilding.alt,
    imagePosition: "object-center",
    icon: "graduation",
    primaryButton: {
      label: "Browse Resources",
      action: "resources",
    },
    secondaryButton: {
      label: "Contribute a PDF",
      action: "contribute",
    },
    cardTitle: "Jana Bhawana Campus",
    cardDescription: "Campus building · Chapagaun",
    cardBadge: "TU BCA Archive",
  },
  {
    id: 2,
    eyebrow: "Moderated Academic Archive",
    title: "Study smarter with",
    highlightedTitle: "reviewed materials.",
    description:
      "Explore organized academic resources arranged by program, semester, subject, and category for focused and reliable study.",
    image: campusImages.library.src,
    imageAlt: campusImages.library.alt,
    imagePosition: "object-center",
    icon: "book",
    primaryButton: {
      label: "Explore Resources",
      action: "resources",
    },
    secondaryButton: {
      label: "Course Structure",
      action: "semesters",
    },
    cardTitle: "Reviewed Resources",
    cardDescription: "Notes · Questions · Projects",
    cardBadge: "Academic Library",
  },
  {
    id: 3,
    eyebrow: "Student-Powered Repository",
    title: "Share knowledge.",
    highlightedTitle: "Strengthen your campus.",
    description:
      "Contribute your notes, project reports, and academic PDFs. Every submission is reviewed before publication.",
    image: campusImages.studentStudy.src,
    imageAlt: campusImages.studentStudy.alt,
    imagePosition: "object-center",
    icon: "upload",
    primaryButton: {
      label: "Contribute a PDF",
      action: "contribute",
    },
    secondaryButton: {
      label: "Browse Archive",
      action: "resources",
    },
    cardTitle: "Student Contributions",
    cardDescription: "Reviewed before publication",
    cardBadge: "Community Archive",
  },
];

const AUTOPLAY_DURATION = 6500;
const SWIPE_THRESHOLD = 70;

const slideVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 70 : -70,
  }),

  center: {
    opacity: 1,
    x: 0,
  },

  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -70 : 70,
  }),
};

function SlideIcon({ icon }: { icon: HeroIcon }) {
  switch (icon) {
    case "graduation":
      return <GraduationCap size={15} aria-hidden="true" />;

    case "upload":
      return <Upload size={15} aria-hidden="true" />;

    case "book":
    default:
      return <BookOpen size={15} aria-hidden="true" />;
  }
}

export function Hero({
  onNavigateResources,
  onNavigateSemesters,
  onNavigateContribute,
}: HeroProps) {
  const shouldReduceMotion = useReducedMotion();

  const [activeSlide, setActiveSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  const currentSlide = slides[activeSlide];

  const showNextSlide = useCallback(() => {
    setDirection(1);

    setActiveSlide((current) => {
      return (current + 1) % slides.length;
    });
  }, []);

  const showPreviousSlide = useCallback(() => {
    setDirection(-1);

    setActiveSlide((current) => {
      return (current - 1 + slides.length) % slides.length;
    });
  }, []);

  const goToSlide = useCallback(
    (index: number) => {
      if (index === activeSlide) {
        return;
      }

      setDirection(index > activeSlide ? 1 : -1);
      setActiveSlide(index);
    },
    [activeSlide],
  );

  const handleAction = useCallback(
    (action: HeroAction) => {
      switch (action) {
        case "resources":
          onNavigateResources?.();
          break;

        case "semesters":
          onNavigateSemesters?.();
          break;

        case "contribute":
          onNavigateContribute?.();
          break;

        default:
          break;
      }
    },
    [
      onNavigateContribute,
      onNavigateResources,
      onNavigateSemesters,
    ],
  );

  useEffect(() => {
    if (shouldReduceMotion) {
      return;
    }

    const timeout = window.setTimeout(() => {
      showNextSlide();
    }, AUTOPLAY_DURATION);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [activeSlide, shouldReduceMotion, showNextSlide]);

  return (
    <section
      className="relative isolate w-full overflow-hidden bg-[#001b3a] text-white focus:outline-none"
      aria-label="JBC Athenaeum featured resources"
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDown={(event) => {
        const target = event.target as HTMLElement;

        const isTyping =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable;

        if (isTyping) {
          return;
        }

        if (event.key === "ArrowLeft") {
          showPreviousSlide();
        }

        if (event.key === "ArrowRight") {
          showNextSlide();
        }
      }}
    >
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(196,155,99,0.13),transparent_34%)]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20"
      />

      <div className="relative min-h-[880px] sm:min-h-[820px] lg:min-h-[620px] xl:min-h-[640px]">
        <AnimatePresence
          initial={false}
          custom={direction}
          mode="sync"
        >
          <motion.article
            key={currentSlide.id}
            custom={direction}
            variants={slideVariants}
            initial={shouldReduceMotion ? false : "enter"}
            animate="center"
            exit={shouldReduceMotion ? undefined : "exit"}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.75,
              ease: [0.22, 1, 0.36, 1],
            }}
            drag={shouldReduceMotion ? false : "x"}
            dragConstraints={{
              left: 0,
              right: 0,
            }}
            dragElastic={0.08}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              if (info.offset.x <= -SWIPE_THRESHOLD) {
                showNextSlide();
              }

              if (info.offset.x >= SWIPE_THRESHOLD) {
                showPreviousSlide();
              }
            }}
            className="absolute inset-0"
            aria-live="polite"
          >
            <div className="grid h-full min-h-[880px] w-full grid-rows-[minmax(0,1fr)_18rem] sm:min-h-[820px] sm:grid-rows-[minmax(0,1fr)_20rem] lg:min-h-[620px] lg:grid-cols-[56%_44%] lg:grid-rows-1 xl:min-h-[640px]">
              {/* Left content */}
              <div className="relative z-10 flex min-w-0 flex-col justify-center px-6 py-12 sm:px-10 sm:py-14 lg:px-14 lg:py-14 xl:px-20 2xl:pl-32">
                <motion.div
                  key={`content-${currentSlide.id}`}
                  initial={
                    shouldReduceMotion
                      ? false
                      : {
                          opacity: 0,
                          y: 24,
                        }
                  }
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.65,
                    delay: shouldReduceMotion ? 0 : 0.12,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="w-full max-w-[800px]"
                >
                  {/* Eyebrow */}
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="h-px w-8 shrink-0 bg-[#d8b37a] sm:w-10"
                    />

                    <span className="flex min-w-0 items-center gap-2 text-[9px] font-black uppercase tracking-[0.25em] text-[#d8b37a] sm:text-[10px] sm:tracking-[0.34em]">
                      <SlideIcon icon={currentSlide.icon} />

                      <span className="truncate">
                        {currentSlide.eyebrow}
                      </span>
                    </span>
                  </div>

                  {/* Heading */}
                  <h2 className="mt-6 max-w-[780px] font-serif text-[2.65rem] font-black leading-[0.98] tracking-[-0.035em] text-white sm:text-[3.65rem] lg:text-[3.9rem] xl:text-[4.4rem]">
                    <span className="block">
                      {currentSlide.title}
                    </span>

                    <span className="mt-1 block text-[#d7ab70]">
                      {currentSlide.highlightedTitle}
                    </span>
                  </h2>

                  {/* Description */}
                  <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-200/90 sm:text-base sm:leading-8 lg:text-[17px]">
                    {currentSlide.description}
                  </p>

                  {/* Action buttons */}
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleAction(currentSlide.primaryButton.action);
                      }}
                      className="group relative inline-flex min-h-14 items-center justify-center gap-3 overflow-hidden rounded-xl bg-[#d4aa70] px-7 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-[#001b3a] shadow-[0_18px_45px_rgba(196,155,99,0.2)] transition duration-300 hover:-translate-y-1 hover:bg-[#dfb97f] hover:shadow-[0_24px_55px_rgba(196,155,99,0.3)]"
                    >
                      <span className="absolute inset-0 translate-y-full bg-white/20 transition-transform duration-300 group-hover:translate-y-0" />

                      <span className="relative z-10">
                        {currentSlide.primaryButton.label}
                      </span>

                      <ArrowRight
                        size={17}
                        aria-hidden="true"
                        className="relative z-10 transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleAction(currentSlide.secondaryButton.action);
                      }}
                      className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-xl border border-white/30 bg-white/[0.04] px-7 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-[#d4aa70] hover:bg-white/[0.09]"
                    >
                      <span>
                        {currentSlide.secondaryButton.label}
                      </span>

                      <ArrowRight
                        size={17}
                        aria-hidden="true"
                        className="text-[#d4aa70] transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </button>
                  </div>

                  {/* Institution */}
                  <p className="mt-7 flex items-center gap-3 text-[8px] font-bold uppercase tracking-[0.22em] text-slate-400 sm:text-[9px] sm:tracking-[0.3em]">
                    <span
                      aria-hidden="true"
                      className="h-1 w-1 shrink-0 rounded-full bg-[#d4aa70]"
                    />

                    Tribhuvan University · Chapagaun, Lalitpur
                  </p>

                  {/* Minimal dot-line indicators */}
                  <div className="mt-6 flex items-center gap-3">
                    {slides.map((slide, index) => {
                      const isActive = index === activeSlide;

                      return (
                        <button
                          key={slide.id}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            goToSlide(index);
                          }}
                          aria-label={`Show slide ${index + 1}: ${slide.eyebrow}`}
                          aria-current={isActive ? "true" : undefined}
                          className="group flex h-8 items-center justify-center"
                        >
                          <span
                            className={`relative block overflow-hidden rounded-full transition-all duration-500 ${
                              isActive
                                ? "h-1 w-14 bg-white/15"
                                : "h-2 w-2 bg-white/30 group-hover:bg-white/60"
                            }`}
                          >
                            {isActive && !shouldReduceMotion && (
                              <motion.span
                                key={`progress-${activeSlide}`}
                                initial={{
                                  scaleX: 0,
                                }}
                                animate={{
                                  scaleX: 1,
                                }}
                                transition={{
                                  duration:
                                    AUTOPLAY_DURATION / 1000,
                                  ease: "linear",
                                }}
                                className="absolute inset-0 origin-left rounded-full bg-[#d4aa70]"
                              />
                            )}

                            {isActive && shouldReduceMotion && (
                              <span className="absolute inset-0 rounded-full bg-[#d4aa70]" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </div>

              {/* Right image */}
              <figure className="group relative min-h-0 overflow-hidden bg-[#001b3a]">
                <motion.img
                  key={`image-${currentSlide.id}`}
                  initial={
                    shouldReduceMotion
                      ? false
                      : {
                          opacity: 0,
                          scale: 1.08,
                        }
                  }
                  animate={{
                    opacity: 1,
                    scale: 1.02,
                  }}
                  transition={{
                    opacity: {
                      duration: shouldReduceMotion ? 0 : 0.8,
                    },
                    scale: {
                      duration: shouldReduceMotion
                        ? 0
                        : AUTOPLAY_DURATION / 1000,
                      ease: "linear",
                    },
                  }}
                  src={currentSlide.image}
                  alt={currentSlide.imageAlt}
                  loading={activeSlide === 0 ? "eager" : "lazy"}
                  decoding="async"
                  fetchPriority={activeSlide === 0 ? "high" : "auto"}
                  className={`absolute inset-0 h-full w-full object-cover ${currentSlide.imagePosition}`}
                  draggable={false}
                />

                {/* Image overlays */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#001b3a]/80 via-transparent to-[#001b3a]/5"
                />

                <div
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 hidden w-36 bg-gradient-to-r from-[#001b3a] via-[#001b3a]/50 to-transparent lg:block"
                />

                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[#001b3a]/5"
                />

                {/* Image top label */}
                <div className="absolute left-5 top-5 border border-white/25 bg-[#001b3a]/80 px-4 py-2 text-[8px] font-black uppercase tracking-[0.25em] text-white shadow-lg backdrop-blur-md sm:left-7 sm:top-7">
                  Established Academic Community
                </div>

                {/* Image information card */}
                <figcaption className="absolute bottom-5 left-5 right-5 border-l-2 border-[#d4aa70] bg-[#001b3a]/90 px-4 py-4 shadow-2xl backdrop-blur-xl sm:bottom-7 sm:left-7 sm:right-7 sm:px-5">
                  <div className="flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      <span className="block truncate text-[9px] font-black uppercase tracking-[0.24em] text-[#d4aa70]">
                        {currentSlide.cardTitle}
                      </span>

                      <span className="mt-1 block truncate text-xs font-semibold text-white sm:text-sm">
                        {currentSlide.cardDescription}
                      </span>
                    </div>

                    <span className="hidden shrink-0 rounded-full border border-white/25 px-3 py-1 text-[7px] font-black uppercase tracking-[0.12em] text-white sm:inline-flex">
                      {currentSlide.cardBadge}
                    </span>
                  </div>
                </figcaption>
              </figure>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>
    </section>
  );
}