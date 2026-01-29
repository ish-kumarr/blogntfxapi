import { NextResponse, NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { blogPostSchema } from '@/lib/schemas';
import { z } from 'zod';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const client = await clientPromise;
    const db = client.db("blog");

    // Decode the slug to handle any URL encoding
    const decodedSlug = decodeURIComponent(slug);


    // Find the post using a case-insensitive regex for the slug
    const post = await db.collection("posts").findOne({ slug: { $regex: new RegExp(`^${decodedSlug}$`, 'i') } });

    if (!post) {

      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Convert _id to a string and map it to id
    const { _id, ...rest } = post;
    const postWithId = { ...rest, id: _id.toHexString() };

    return NextResponse.json({ post: postWithId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error fetching post' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const client = await clientPromise;
    const db = client.db("blog");

    const json = await request.json();
    const updatedPostData = blogPostSchema.parse(json);

    const result = await db.collection("posts").updateOne(
      { slug: slug }, // Use the awaited slug
      { $set: updatedPostData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: e.issues }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Error updating post' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const client = await clientPromise;
    const db = client.db("blog");

    const result = await db.collection("posts").deleteOne({ slug: slug }); // Use the awaited slug

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedCount: result.deletedCount });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error deleting post' }, { status: 500 });
  }
}
