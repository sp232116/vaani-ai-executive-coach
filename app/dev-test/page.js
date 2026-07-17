import { notFound } from "next/navigation";
import DevTestForm from "./dev-test-form";

export default function DevTestPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <DevTestForm />;
}
