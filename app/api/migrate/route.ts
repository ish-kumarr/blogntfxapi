import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import fs from 'fs';
import path from 'path';

// The path to blogs.json relative to the Next.js project root
const blogsPath = path.resolve(process.cwd(), '../../src/data/blogs.json');

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("blog");
    const postsCollection = db.collection("posts");

    // Check if the collection is already populated
    const count = await postsCollection.countDocuments();
    if (count > 0) {
      return NextResponse.json({ message: 'Migration has already been run. The "posts" collection is not empty.' }, { status: 409 }); // 409 Conflict
    }

    const blogsData = fs.readFileSync(blogsPath, 'utf-8');
    const blogs = JSON.parse(blogsData);

    let successCount = 0;
    let errorCount = 0;

    for (const blog of blogs) {
      const { id, ...postData } = blog;
      try {
        await postsCollection.insertOne(postData);
        successCount++;
      } catch (e) {
        console.error(`Error inserting post "${postData.title}":`, e);
        errorCount++;
      }
    }

    return NextResponse.json({
      message: 'Migration completed.',
      successfullyMigrated: successCount,
      failedToMigrate: errorCount,
    });

  } catch (e) {
    console.error(e);
    if (e instanceof Error && (e as any).code === 'ENOENT') {
      return NextResponse.json({ error: 'Migration failed: blogs.json file not found. Check the path.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred during migration.' }, { status: 500 });
  }
}
