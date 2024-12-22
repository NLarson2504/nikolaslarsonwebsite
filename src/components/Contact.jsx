import emailjs from "emailjs-com";

function Contact() {
  const sendEmail = (e) => {
    e.preventDefault();

    emailjs
      .sendForm(
        "service_3amebrj", // Replace with your EmailJS Service ID
        "template_q126lg4", // Replace with your EmailJS Template ID
        e.target,
        "zjHsV_tywr2_0qK9O" // Replace with your EmailJS User ID
      )
      .then(
        (result) => {
          alert("Message sent successfully!");
          console.log(result.text);
        },
        (error) => {
          alert("Failed to send message. Please try again later.");
          console.log(error.text);
        }
      );

    e.target.reset(); // Clear the form after submission
  };

  return (
    <div className="w-full h-auto flex flex-col space-y-8 px-8 pt-16">
      {/* Section Title */}
      <div className="text-7xl font-bold text-white uppercase">Contact</div>

      {/* Section Description */}
      <div className="text-lg text-white opacity-75 max-w-2xl">
        Feel free to reach out if you have any questions, want to collaborate, or just want to say hi!
      </div>

      {/* Contact Form */}
      <form onSubmit={sendEmail} className="w-full max-w-2xl space-y-6">
        {/* Name Input */}
        <div>
          <label htmlFor="name" className="block text-white opacity-75 mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="w-full px-4 py-3 bg-white/10 text-white rounded-lg backdrop-blur-md shadow-lg focus:outline-none focus:ring-2 focus:ring-white/30"
            placeholder="Your Name"
            required
          />
        </div>

        {/* Email Input */}
        <div>
          <label htmlFor="email" className="block text-white opacity-75 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className="w-full px-4 py-3 bg-white/10 text-white rounded-lg backdrop-blur-md shadow-lg focus:outline-none focus:ring-2 focus:ring-white/30"
            placeholder="Your Email"
            required
          />
        </div>

        {/* Message Input */}
        <div>
          <label htmlFor="message" className="block text-white opacity-75 mb-2">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows="4"
            className="w-full px-4 py-3 bg-white/10 text-white rounded-lg backdrop-blur-md shadow-lg focus:outline-none focus:ring-2 focus:ring-white/30"
            placeholder="Your Message"
            required
          ></textarea>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            className="px-6 py-3 bg-white/10 text-white text-lg rounded-lg backdrop-blur-md hover:bg-white/20 transition-all shadow-lg focus:ring-2 focus:ring-white/30"
          >
            Send Message
          </button>
        </div>
      </form>
    </div>
  );
}

export default Contact;
