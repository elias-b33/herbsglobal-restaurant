import ServiceFlow from "../ui/service-flow";
export const metadata = { title: "Book a table", description: "Choose a date, time and party size and book your table at Global Herbs, Bucharest." };
export default function Page() { return <ServiceFlow kind="book" />; }
