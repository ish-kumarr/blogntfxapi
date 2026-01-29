import { NextResponse, NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { blogPostSchema } from '@/lib/schemas';
import { z } from 'zod';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id:string }> }
) {
  try {
    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("blog");

    const json = await request.json();
    const updatedPostData = blogPostSchema.parse(json);

    const result = await db.collection("posts").updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedPostData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: e.issues }, { status: 400 });
    }
    console.error('Error updating post:', e);
    return NextResponse.json({ error: 'Error updating post' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("blog");

    const result = await db.collection("posts").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Error deleting post:', e);
    return NextResponse.json({ error: 'Error deleting post' }, { status: 500 });
  }
}
