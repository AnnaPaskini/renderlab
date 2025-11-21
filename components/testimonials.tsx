"use client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useMemo } from "react";
import { InViewDiv } from "./in-view-div";
import { TestimonialColumnContainer } from "./testimonial-column-container";

export const Testimonials = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Testimonial 1 */}
      <div className="bg-gray-900/50 shadow-lg shadow-black/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-orange-500" />
          <div>
            <div className="font-semibold text-white">Architecture Studio</div>
            <div className="text-sm text-gray-400">Senior Architect</div>
          </div>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">
          "Cut our rendering time by 70%. Client presentations now include multiple style variations in minutes instead of days."
        </p>
        <div className="mt-4 flex gap-1">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-orange-400">★</span>
          ))}
        </div>
      </div>

      {/* Testimonial 2 */}
      <div className="bg-gray-900/50 shadow-lg shadow-black/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-purple-500" />
          <div>
            <div className="font-semibold text-white">Visualization Specialist</div>
            <div className="text-sm text-gray-400">Freelance Designer</div>
          </div>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">
          "Game-changer for my workflow. I can now offer clients 10+ style options for every project. Increased my revenue by 40%."
        </p>
        <div className="mt-4 flex gap-1">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-orange-400">★</span>
          ))}
        </div>
      </div>

      {/* Testimonial 3 */}
      <div className="bg-gray-900/50 shadow-lg shadow-black/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-orange-500" />
          <div>
            <div className="font-semibold text-white">Design Firm</div>
            <div className="text-sm text-gray-400">Principal</div>
          </div>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">
          "Perfect for rapid prototyping. We can test different aesthetics instantly. Clients love seeing multiple options before final render."
        </p>
        <div className="mt-4 flex gap-1">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-orange-400">★</span>
          ))}
        </div>
      </div>
    </div>
  );
};

interface Testimonial {
  name: string;
  quote: string;
  src: string;
  designation?: string;
}

const testimonials = [
  {
    name: "Manu Arora",
    quote:
      "What a fantastic tool RenderLab is, I just love it. It has completely transformed the way I approach problems and develop solutions.",
    src: "https://i.pravatar.cc/150?img=1",
    designation: "Tech Innovator & Entrepreneur",
  },
  {
    name: "Tyler Durden",
    quote:
      "I made a soap with the help of AI, it was so easy to use. I'm so glad this happened because it revolutionized my entire business model and production process.",
    src: "https://i.pravatar.cc/150?img=2",
    designation: "Creative Director & Business Owner",
  },
  {
    name: "Alice Johnson",
    quote:
      "This AI has transformed the way I work! It's like having a brilliant assistant who knows exactly what I need before I even ask.",
    src: "https://i.pravatar.cc/150?img=3",
    designation: "Senior Software Engineer",
  },
  {
    name: "Bob Smith",
    quote:
      "Absolutely revolutionary, a game-changer for our industry. It has streamlined our processes and enhanced our productivity dramatically.",
    src: "https://i.pravatar.cc/150?img=4",
    designation: "Industry Analyst",
  },
  {
    name: "Cathy Lee",
    quote:
      "I can't imagine going back to how things were before this AI. It has not only improved my work efficiency but also my daily life.",
    src: "https://i.pravatar.cc/150?img=5",
    designation: "Product Manager",
  },
  {
    name: "David Wright",
    quote:
      "It's like having a superpower! This AI tool has given us the ability to do things we never thought were possible in our field.",
    src: "https://i.pravatar.cc/150?img=6",
    designation: "Research Scientist",
  },
  {
    name: "Eva Green",
    quote:
      "The efficiency it brings is unmatched. It's a vital tool that has helped us cut costs and improve our end product significantly.",
    src: "https://i.pravatar.cc/150?img=7",
    designation: "Operations Director",
  },
  {
    name: "Frank Moore",
    quote:
      "A robust solution that fits perfectly into our workflow. It has enhanced our team's capabilities and allowed us to tackle more complex projects.",
    src: "https://i.pravatar.cc/150?img=8",
    designation: "Project Manager",
  },
  {
    name: "Grace Hall",
    quote:
      "It's incredibly intuitive and easy to use. Even those without technical expertise can leverage its power to improve their workflows.",
    src: "https://i.pravatar.cc/150?img=9",
    designation: "Marketing Specialist",
  },
  {
    name: "Henry Ford",
    quote:
      "It has saved us countless hours. Highly recommended for anyone looking to enhance their efficiency and productivity.",
    src: "https://i.pravatar.cc/150?img=10",
    designation: "Operations Analyst",
  },
  {
    name: "Ivy Wilson",
    quote:
      "A must-have tool for any professional. It's revolutionized the way we approach problem-solving and decision-making.",
    src: "https://i.pravatar.cc/150?img=11",
    designation: "Business Consultant",
  },
  {
    name: "Jack Brown",
    quote:
      "The results are always impressive. This AI has helped us to not only meet but exceed our performance targets.",
    src: "https://i.pravatar.cc/150?img=12",
    designation: "Performance Manager",
  },
  {
    name: "Kathy Adams",
    quote:
      "It helps us achieve what was once thought impossible. The AI's capabilities are groundbreaking and have opened new avenues for us.",
    src: "https://i.pravatar.cc/150?img=13",
    designation: "Innovation Lead",
  },
  {
    name: "Leo Carter",
    quote:
      "Transformative technology with real impact. It has streamlined our operations and brought unprecedented efficiency to our processes.",
    src: "https://i.pravatar.cc/150?img=14",
    designation: "Technology Strategist",
  },
  {
    name: "Mia Turner",
    quote:
      "It's simply revolutionary! The way it integrates with our existing systems and enhances them is nothing short of miraculous.",
    src: "https://i.pravatar.cc/150?img=15",
    designation: "Systems Integrator",
  },
  {
    name: "Nathan Hill",
    quote:
      "The best investment we've made in years. It's not just a tool; it's a game-changer that has propelled our business forward.",
    src: "https://i.pravatar.cc/150?img=16",
    designation: "Investment Analyst",
  },
  {
    name: "Olivia Scott",
    quote:
      "It consistently exceeds our expectations. Its adaptability and precision make it indispensable for our daily operations.",
    src: "https://i.pravatar.cc/150?img=17",
    designation: "Quality Assurance Manager",
  },
  {
    name: "Peter White",
    quote:
      "A seamless integration into our daily tasks. It has enhanced our productivity and allowed us to focus on more strategic initiatives.",
    src: "https://i.pravatar.cc/150?img=18",
    designation: "Strategic Planner",
  },
  {
    name: "Quinn Taylor",
    quote:
      "It's a game-changer for our business. The insights it provides are invaluable and have driven substantial growth for us.",
    src: "https://i.pravatar.cc/150?img=19",
    designation: "Growth Manager",
  },
  {
    name: "Rachel Black",
    quote:
      "The support team is as impressive as the technology itself. They ensure we maximize the utility of the AI in our operations.",
    src: "https://i.pravatar.cc/150?img=20",
    designation: "Client Support Coordinator",
  },
  {
    name: "Samuel Lee",
    quote:
      "It's the future, now. Adopting this AI has put us years ahead of the competition in terms of operational efficiency and innovation.",
    src: "https://i.pravatar.cc/150?img=21",
    designation: "Futurist",
  },
  {
    name: "Tina Brooks",
    quote:
      "It has completely changed the way we operate. The AI's ability to analyze and optimize our processes is phenomenal.",
    src: "https://i.pravatar.cc/150?img=22",
    designation: "Process Analyst",
  },
];

function Testimonial({
  name,
  quote,
  src,
  designation,
  className,
  ...props
}: Omit<React.ComponentPropsWithoutRef<"figure">, keyof Testimonial> &
  Testimonial) {
  let animationDelay = useMemo(() => {
    let possibleAnimationDelays = [
      "0s",
      "0.1s",
      "0.2s",
      "0.3s",
      "0.4s",
      "0.5s",
    ];
    return possibleAnimationDelays[
      Math.floor(Math.random() * possibleAnimationDelays.length)
    ];
  }, []);

  const boxStyle = {};
  return (
    <figure
      className={cn(
        "animate-fade-in rounded-3xl bg-transparent p-8 opacity-0 shadow-derek dark:bg-neutral-900",
        className
      )}
      style={{
        animationDelay,
      }}
      {...props}
    >
      <div className="flex flex-col items-start">
        <div className="flex gap-2">
          <Image
            src={src}
            width={150}
            height={150}
            className="h-10 w-10 rounded-full"
            alt={name}
          />
          <div>
            <h3 className="text-sm  font-medium text-neutral-500 dark:text-neutral-300">
              {name}
            </h3>
            <p className="text-sm font-normal text-neutral-500 dark:text-neutral-300">
              {designation}
            </p>
          </div>
        </div>
        <p className="text-base text-muted mt-4 dark:text-muted-dark">
          {quote}
        </p>
      </div>
    </figure>
  );
}

function TestimonialColumn({
  testimonials,
  className,
  containerClassName,
  shift = 0,
}: {
  testimonials: Testimonial[];
  className?: string;
  containerClassName?: (reviewIndex: number) => string;
  shift?: number;
}) {
  return (
    <TestimonialColumnContainer className={cn(className)} shift={shift}>
      {testimonials
        .concat(testimonials)
        .map((testimonial, testimonialIndex) => (
          <Testimonial
            name={testimonial.name}
            quote={testimonial.quote}
            src={testimonial.src}
            designation={testimonial.designation}
            key={testimonialIndex}
            className={containerClassName?.(
              testimonialIndex % testimonials.length
            )}
          />
        ))}
    </TestimonialColumnContainer>
  );
}

function splitArray<T>(array: Array<T>, numParts: number) {
  let result: Array<Array<T>> = [];
  for (let i = 0; i < array.length; i++) {
    let index = i % numParts;
    if (!result[index]) {
      result[index] = [];
    }
    result[index].push(array[i]);
  }
  return result;
}

function TestimonialGrid() {
  let columns = splitArray(testimonials, 3);
  let column1 = columns[0];
  let column2 = columns[1];
  let column3 = splitArray(columns[2], 2);
  return (
    <InViewDiv className="relative -mx-4 mt-16 grid h-[49rem] max-h-[150vh] grid-cols-1 items-start gap-8 overflow-hidden px-4 sm:mt-20 md:grid-cols-2 lg:grid-cols-3">
      <TestimonialColumn
        testimonials={[...column1, ...column3.flat(), ...column2]}
        containerClassName={(tIndex) =>
          cn(
            tIndex >= column1.length + column3[0].length && "md:hidden",
            tIndex >= column1.length && "lg:hidden"
          )
        }
        shift={10}
      />
      <TestimonialColumn
        testimonials={[...column2, ...column3[1]]}
        className="hidden md:block"
        containerClassName={(tIndex) =>
          tIndex >= column2.length ? "lg:hidden" : ""
        }
        shift={15}
      />
      <TestimonialColumn
        testimonials={column3.flat()}
        className="hidden lg:block"
        shift={10}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white dark:from-black" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white dark:from-black" />
    </InViewDiv>
  );
}
