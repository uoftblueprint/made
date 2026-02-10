export default function HelloWorld() {
  return (
  <div className="px-10 pt-10 flex flex-col items-start space-y-lg">


      {/* Heading */}
      <h1 className="text-3xl md:text-4xl font-heading text-primary">
        Hello World
      </h1>

      {/* Subheading / Body */}
      <p className="text-base md:text-lg font-sans text-gray-700 text-center max-w-md ">
        This page demonstrates the correct use of
        typography, spacing, and colors from Figma.
      </p>

      {/* Button using accent color */}
      <button
        className="rounded-lg font-sans font-medium text-lg cursor-pointer transition"
        style={{
          backgroundColor: "accent",
          color: "white",
          padding: "0.75rem 1rem", 
        }}
      >
        Test Button
      </button>
    </div>
  );
}