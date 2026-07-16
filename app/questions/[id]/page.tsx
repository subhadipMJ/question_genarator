type QuestionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: QuestionPageProps) {
  const { id } = await params

  return <div>Page ID: {id}</div>
}
