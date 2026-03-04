import { redirect } from "next/navigation";

export default async function DayDateRedirect({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (date?.match(/^\d{4}-\d{2}-\d{2}$/)) {
    redirect(`/?date=${date}`);
  }
  redirect("/");
}
