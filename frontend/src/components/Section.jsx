const Section = ({ title, children, className = "" }) => {
  return (
    <section className={`bg-gray-900 border border-gray-800 rounded-lg p-8 shadow-xl ${className}`}>
      <h2 className="text-xl font-bold mb-6 border-l-4 border-teal-600 pl-3">
        {title}
      </h2>
      {children}
    </section>
  );
};

export default Section;
