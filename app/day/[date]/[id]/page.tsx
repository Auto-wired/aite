import { redirect } from "next/navigation";

export default async function DayDateIdRedirect({
  params,
}: {
  params: Promise<{ date: string; id: string }>;
}) {
  const { date, id } = await params;
  if (date?.match(/^\d{4}-\d{2}-\d{2}$/) && id) {
    redirect(`/?date=${date}&entry=${id}`);
  }
  redirect("/");
}
