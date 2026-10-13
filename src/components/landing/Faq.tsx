import { HelpCircle } from "lucide-react";
import Watermark from "@/components/landing/Watermark";

const faqs = [
  {
    q: "What is Kapes?",
    a: "Kapes is a vehicle capacity marketplace. Drivers with unused space on a trip and customers who need to ship cargo are matched on one platform, so goods travel on vehicles that are already on the road.",
  },
  {
    q: "How does Kapes work?",
    a: "Drivers post a trip with their route, vehicle type, available capacity, departure date and price per kilogram. Customers search by pickup city, drop-off city and date, then book the space they need. Cargo is tracked and paid for securely.",
  },
  {
    q: "How much does it cost to use Kapes?",
    a: "Creating an account and posting a trip on Kapes is free. Customers pay for the space they book based on the driver's price per kilogram, so you only pay for the capacity you actually use.",
  },
  {
    q: "Who can use Kapes?",
    a: "Anyone with cargo to move — individuals, shops and businesses — can book space. Drivers, fleet owners and transporters with spare capacity can post trips and earn from the empty space they are already travelling with.",
  },
  {
    q: "Are the drivers verified?",
    a: "Yes. Kapes works with verified drivers and vehicles. Drivers submit their vehicle and licence documents, which are reviewed before their trips go live.",
  },
  {
    q: "Which cities and routes does Kapes cover?",
    a: "Kapes covers intercity routes across India. Availability depends on the trips posted, so search for your pickup and drop-off cities to see the live capacity currently heading your way.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

const Faq = () => {
  return (
    <section
      id="faq"
      className="relative scroll-mt-16 overflow-hidden py-8 sm:scroll-mt-24 sm:py-12 lg:py-16"
    >
      <div className="container">
        <div className="mx-auto mb-5 max-w-2xl text-center sm:mb-10">
          <p className="mb-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary sm:text-xs">
            FAQ
          </p>
          <h2 className="text-lg font-extrabold tracking-tight sm:text-2xl lg:text-3xl md:text-4xl">
            Kapes, answered
          </h2>
          <p className="mt-2 text-xs text-muted-foreground sm:mt-3 sm:text-base">
            Everything you need to know about shipping with spare vehicle capacity.
          </p>
        </div>

        <div className="mx-auto max-w-3xl space-y-3 sm:space-y-4">
          {faqs.map((faq) => (
            <div key={faq.q} className="rounded-xl border bg-card p-4 sm:rounded-2xl sm:p-5">
              <h3 className="text-sm font-bold leading-tight sm:text-base">{faq.q}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:mt-2 sm:text-sm">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
      <Watermark
        icon={HelpCircle}
        className="-right-8 top-6 h-28 w-28 -rotate-12 opacity-[0.05] dark:opacity-[0.06] sm:top-16 sm:h-56 sm:w-56 sm:opacity-[0.07] sm:dark:opacity-[0.08]"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </section>
  );
};

export default Faq;
