export default function PostList() {
  const posts = [
    {
      content: "Finished a kitchen renovation",
      image: "/work1.jpg"
    }
  ];

  return (
    <div className="space-y-4">
      {posts.map((p, i) => (
        <div key={i} className="bg-[#1E293B] border border-white/10 p-5 rounded-[20px] shadow-md hover:shadow-lg transition-all duration-300">
          <p className="text-sm text-white/90 leading-relaxed">{p.content}</p>

          {p.image && (
            <div className="mt-4 rounded-[15px] overflow-hidden border border-white/5">
              <img
                src={p.image}
                alt="post"
                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}