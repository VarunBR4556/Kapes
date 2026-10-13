const About = () => {
  return (
    <section id="about" className="scroll-mt-16 py-8 sm:scroll-mt-24 sm:py-12 lg:py-16">
      <div className="container max-w-3xl">
        <p className="mb-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary sm:text-xs">
          About Kapes
        </p>
        <h2 className="text-lg font-extrabold tracking-tight sm:text-2xl lg:text-3xl md:text-4xl">
          What is Kapes?
        </h2>
        <div className="mt-3 space-y-3 text-xs leading-relaxed text-muted-foreground sm:text-base">
          <p>
            Kapes is a vehicle capacity marketplace that connects drivers travelling
            between cities with customers who need to move cargo. Instead of running a
            dedicated vehicle for every shipment, customers book space that is already
            heading their way — a truck, tempo, container or any vehicle with room to
            spare.
          </p>
          <p>
            For drivers and fleet owners, Kapes turns empty capacity into revenue on
            trips they were already making. For customers, it means faster and cheaper
            shipping across India without waiting to fill an entire truck. Drivers and
            vehicles are verified, so you always know who is carrying your goods.
          </p>
          <p>
            Search by pickup city, destination and date to see live trips, compare
            prices per kilogram, and book only the space you need. It is shipping built
            around the journeys that are already on the road.
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;
