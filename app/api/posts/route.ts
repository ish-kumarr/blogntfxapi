import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { blogPostSchema } from '@/lib/schemas';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("blog");
    const postsFromDb = await db.collection("posts").find({}).sort({ publishDate: -1 }).toArray();

    const posts = postsFromDb.map(post => {
      const { _id, ...rest } = post;
      return { ...rest, id: _id.toHexString() };
    });

    return NextResponse.json({ posts });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error fetching posts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const newPost = blogPostSchema.parse(json);

    const client = await clientPromise;
    const db = client.db("blog");
    const result = await db.collection("posts").insertOne(newPost);

    return NextResponse.json({ success: true, insertedId: result.insertedId }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: e.issues }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Error creating post' }, { status: 500 });
  }
}
