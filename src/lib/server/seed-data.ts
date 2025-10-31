import type { UuidV7 } from '$lib/utils';
import type { DrizzleDB } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// Demo user ID - fixed for development
export const DEMO_USER_ID = '01936f42-0000-7000-8000-000000000000' as UuidV7;

/**
 * Create or update demo user for development
 * Only call in development environment
 */
export async function seedDemoUser(db: DrizzleDB) {
	const now = Date.now();

	// Create demo user with otter avatar
	await db
		.insert(table.user)
		.values({
			id: DEMO_USER_ID,
			githubId: -1, // Special ID for demo user
			username: 'Otto the Otter',
			email: 'otto@refinery.local',
			avatarUrl: '/images/otto.png',
			createdAt: new Date(now - 30 * 24 * 60 * 60 * 1000), // 30 days ago
			updatedAt: new Date(now)
		})
		.onConflictDoUpdate({
			target: table.user.id,
			set: {
				updatedAt: new Date(now)
			}
		});

	// Create demo user settings
	await db
		.insert(table.contentSettings)
		.values({
			id: '01936f42-0001-7000-8000-000000000000' as UuidV7,
			userId: DEMO_USER_ID,
			targetAudience:
				'Developers, indie hackers, and founders building in public. People who create technical content and want authentic, practical advice.',
			brandVoice:
				'Conversational yet precise. Technical but accessible. Shares real experiences, not generic advice. Values clarity and authenticity over polish.',
			contentPillars:
				'Local-first software, productivity tools, content creation workflows, SvelteKit & modern web development',
			uniquePerspective:
				'I help developers build better tools by sharing what actually works. Real workflows, real problems, real solutions.',
			createdAt: new Date(now - 30 * 24 * 60 * 60 * 1000),
			updatedAt: new Date(now - 1 * 24 * 60 * 60 * 1000)
		})
		.onConflictDoUpdate({
			target: table.contentSettings.userId,
			set: {
				targetAudience:
					'Developers, indie hackers, and founders building in public. People who create technical content and want authentic, practical advice.',
				brandVoice:
					'Conversational yet precise. Technical but accessible. Shares real experiences, not generic advice. Values clarity and authenticity over polish.',
				contentPillars:
					'Local-first software, productivity tools, content creation workflows, SvelteKit & modern web development',
				uniquePerspective:
					'I help developers build better tools by sharing what actually works. Real workflows, real problems, real solutions.',
				updatedAt: new Date(now - 1 * 24 * 60 * 60 * 1000)
			}
		});

	// Delete existing demo content to avoid duplicates
	await db.delete(table.contentArtifact).where(eq(table.contentArtifact.userId, DEMO_USER_ID));
	await db.delete(table.contentIdea).where(eq(table.contentIdea.userId, DEMO_USER_ID));

	// Seed demo user's content
	await seedUserData(db, DEMO_USER_ID);
}

/**
 * Seed example data for new users
 * Provides pre-built ideas and artifacts to demonstrate the app
 */
export async function seedUserData(db: DrizzleDB, userId: UuidV7) {
	const { v7: uuidv7 } = await import('uuid');
	const now = Date.now();

	// Idea 1: Refinery Discovery Story (user POV)
	const idea1Id = uuidv7() as UuidV7;
	await db.insert(table.contentIdea).values({
		id: idea1Id,
		userId,
		oneLiner: 'I found Refinery and it completely changed my content workflow',
		status: 'developing',
		content: `**Before Refinery:**
My content ideas were scattered everywhere - Apple Notes, random Google Docs, Twitter drafts, bookmarks I'd never revisit. Every time I wanted to create something, I'd spend 20 minutes just finding my notes.

**What Changed:**
Started using Refinery last week and it's the first content tool that actually fits my workflow:
- Quick capture on mobile (share sheet is 🔥)
- One place for all ideas, no matter the format
- Easy to adapt content across platforms
- Works offline automatically

**The Real Value:**
I can capture an idea in 5 seconds on my phone, then develop it when I have time. The prompt library helps me turn one piece of content into multiple formats without manual reformatting.

**What I'm doing now:**
- Inbox has 15+ quick captures
- Developing 3 pieces for next week
- Ready to publish: thread about local-first tools`,
		notes: `Possible angles:
- Full walkthrough tutorial
- Before/after workflow comparison
- Specific feature highlights (offline, share sheet, prompts)
- Comparison with other tools I've tried

Could expand into:
- Twitter thread about finding the tool
- LinkedIn post about productivity improvement
- Blog post: "How I organize 50+ content ideas"`,
		tags: ['refinery', 'productivity', 'workflow', 'tools'],
		createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000), // 2 days ago
		updatedAt: new Date(now - 1 * 24 * 60 * 60 * 1000) // 1 day ago
	});

	// Artifact for Idea 1: Twitter Thread (user testimonial)
	await db.insert(table.contentArtifact).values({
		id: uuidv7() as UuidV7,
		userId,
		ideaId: idea1Id,
		title: 'Refinery Discovery - Twitter Thread',
		content: `1/8 🧵 Just found a content tool that actually makes sense for how I work.

It's called Refinery and I'm genuinely impressed.

2/8 The problem: I had content ideas everywhere.

Notes app, Twitter drafts, random Google Docs. I'd lose half my ideas before I could use them.

3/8 What makes Refinery different:

✅ Mobile-first capture (share sheet works perfectly)
✅ Offline by default (local-first architecture)
✅ One idea → multiple platforms
✅ No subscription BS, just works

4/8 The workflow is simple:

Capture → Develop → Adapt → Publish

I can grab an idea on my phone in 5 seconds, develop it later on desktop.

5/8 The prompt library is clever. Instead of manually reformatting for each platform, it helps you adapt content:

Same idea → Twitter thread + LinkedIn post + blog article

6/8 Best part? Works offline automatically.

I can capture ideas on the subway, review them on a plane. No "please check your connection" nonsense.

7/8 Built by @[creator] using SvelteKit and Zero for local-first sync.

It's what I wish Notion was for content creation.

8/8 If you create content regularly and hate juggling tools, worth checking out.

Not affiliated, just sharing what's working for me 🚀`,
		artifactType: 'thread',
		platform: 'Twitter / X',
		status: 'ready',
		plannedPublishDate: new Date(now + 7 * 24 * 60 * 60 * 1000), // 7 days from now
		publishedAt: null,
		publishedUrl: null,
		impressions: null,
		likes: null,
		comments: null,
		shares: null,
		notes: 'Authentic testimonial. Could add screenshot. Tag creator when posting.',
		createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000), // 1 day ago
		updatedAt: new Date(now - 1 * 24 * 60 * 60 * 1000)
	});

	// Artifact for Idea 1: LinkedIn Post (user testimonial)
	await db.insert(table.contentArtifact).values({
		id: uuidv7() as UuidV7,
		userId,
		ideaId: idea1Id,
		title: 'Refinery Discovery - LinkedIn Post',
		content: `I just found a content management tool that actually fits how I work.

It's called Refinery, and after a week of using it, I'm rethinking my entire content workflow.

**The Problem I Had:**

My content ideas were scattered across Notes, Google Docs, Twitter drafts, and random bookmarks. Finding anything took 20 minutes. Adapting a blog post into a Twitter thread meant starting from scratch.

**What's Different:**

Refinery is built around a simple workflow: Capture → Develop → Adapt → Publish

• Mobile-first capture with share sheet integration
• Works offline by default (local-first architecture)
• One piece of content → multiple platform formats
• Prompt library for quick adaptation

**The Real Test:**

I captured 15 ideas on my phone this week. Developed 3 of them on desktop. Published 2 across multiple platforms without manual reformatting.

This is what I wanted Notion to be for content creation.

**Technical Note:**

Built with SvelteKit and Zero for local-first sync. It's the kind of tool I'd want to build if I had the time.

If you create content regularly and are tired of juggling tools, worth checking out: [link]

Not affiliated - just genuinely impressed with how well it works.`,
		artifactType: 'short-post',
		platform: 'LinkedIn',
		status: 'ready',
		plannedPublishDate: new Date(now + 3 * 24 * 60 * 60 * 1000), // 3 days from now
		publishedAt: null,
		publishedUrl: null,
		impressions: null,
		likes: null,
		comments: null,
		shares: null,
		notes: 'Professional but authentic. Could add personal workflow diagram.',
		createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
		updatedAt: new Date(now - 1 * 24 * 60 * 60 * 1000)
	});

	// Idea 2: How I use Refinery (workflow showcase)
	const idea2Id = uuidv7() as UuidV7;
	await db.insert(table.contentIdea).values({
		id: idea2Id,
		userId,
		oneLiner: 'How I went from 5 scattered ideas to 20+ organized posts with Refinery',
		status: 'ready',
		content: `**Week 1 with Refinery:**

Started with 5 random ideas in my Notes app. Now I have 20+ organized across different stages.

**My Workflow:**

1. **Capture Phase** (Daily)
   - Use mobile share sheet when I find good articles
   - Quick voice notes while commuting
   - Screenshot interesting tweets and add context
   - Everything goes to Inbox

2. **Processing Phase** (Weekly)
   - Sunday morning: review Inbox
   - Move promising ideas to "Developing"
   - Archive the rest (not deleting - might be useful later)

3. **Development Phase** (2-3x per week)
   - Pick 2-3 ideas to develop
   - Add research notes, outlines, rough drafts
   - Use the Notes section for brainstorming
   - Content Draft section for full posts

4. **Adaptation Phase** (As needed)
   - Use prompt library to create platform versions
   - One blog post → Twitter thread + LinkedIn post
   - Same core message, different formats

5. **Publishing** (Scheduled)
   - Set planned dates on artifacts
   - Timeline view shows my content calendar
   - Track what I've published, what's coming

**Results:**
- 15+ ideas captured this week
- 3 fully developed pieces
- 5 artifacts ready to publish
- Zero lost ideas

This system actually works for me.`,
		notes: `Could add:
- Screenshots of my dashboard
- Before/after comparison
- Specific examples of adapted content
- Time saved vs old workflow

Possible formats:
- Twitter thread (workflow steps)
- Blog post (detailed tutorial)
- YouTube walkthrough`,
		tags: ['refinery', 'workflow', 'productivity', 'content-creation'],
		createdAt: new Date(now - 5 * 60 * 60 * 1000), // 5 hours ago
		updatedAt: new Date(now - 1 * 60 * 60 * 1000) // 1 hour ago
	});

	// Artifact for Idea 2: Twitter Thread (workflow showcase)
	await db.insert(table.contentArtifact).values({
		id: uuidv7() as UuidV7,
		userId,
		ideaId: idea2Id,
		title: 'My Refinery Workflow - Twitter Thread',
		content: `1/9 🧵 How I organize 20+ content ideas without losing my mind.

Using Refinery for a week now. Here's my workflow:

2/9 **Daily Capture**

Everything goes to Inbox:
• Mobile share sheet for articles
• Voice notes while commuting
• Screenshots with quick context

Takes 5 seconds per idea. Zero friction.

3/9 **Weekly Processing** (Sunday AM)

Review Inbox → move good ideas to "Developing"

Archive the rest (not delete - might need later)

This keeps Inbox from becoming overwhelming.

4/9 **Development Phase** (2-3x/week)

Pick 2-3 ideas to expand:
• Research notes
• Outline structure
• Rough draft

Notes section for brainstorming
Content Draft for full posts

5/9 **Adaptation Phase**

Here's the magic: Prompt library helps convert formats

One blog post → Twitter thread + LinkedIn version + newsletter section

Same core message, platform-specific formatting

6/9 **Publishing Schedule**

Set planned dates on artifacts
Timeline view = content calendar
See what's coming, what's overdue

No more "oh crap I forgot to post"

7/9 **Results after 1 week:**

✅ 15 ideas captured
✅ 3 fully developed
✅ 5 artifacts ready to publish
✅ 0 lost ideas

Everything in one place, always synced.

8/9 Best part? Works offline.

Subway commute? Capture ideas.
Airplane? Develop content.

Zero "please check your connection" nonsense.

9/9 If you create content regularly, this workflow might help.

Built with SvelteKit + Zero (local-first sync).

Try it: [link]

Not affiliated, just sharing what works 🚀`,
		artifactType: 'thread',
		platform: 'Twitter / X',
		status: 'draft',
		plannedPublishDate: new Date(now + 5 * 24 * 60 * 60 * 1000), // 5 days from now
		publishedAt: null,
		publishedUrl: null,
		impressions: null,
		likes: null,
		comments: null,
		shares: null,
		notes: 'Could add workflow diagram screenshot. Maybe wait until have more artifacts ready.',
		createdAt: new Date(now - 2 * 60 * 60 * 1000),
		updatedAt: new Date(now - 1 * 60 * 60 * 1000)
	});

	// Idea 3: Lessons learned (Inbox example)
	const idea3Id = uuidv7() as UuidV7;
	await db.insert(table.contentIdea).values({
		id: idea3Id,
		userId,
		oneLiner: 'First week with Refinery: 3 things I learned about my content habits',
		status: 'inbox',
		content: '',
		notes: `Quick thoughts to explore:

1. I capture way more ideas than I thought
   - Had 20+ ideas in first 3 days
   - Most were quick observations or article reactions
   - Before Refinery: these just disappeared

2. Mobile capture is a game changer
   - 80% of my captures happen on phone
   - Share sheet makes it instant
   - Would never open a laptop to note these

3. Batching development works better than I expected
   - Sunday AM: process inbox
   - Wed/Fri evenings: develop content
   - Way more efficient than switching all day

Could expand on:
- Why batching works for me
- Mobile vs desktop workflow differences
- What types of ideas I'm capturing most

Maybe become: reflective blog post or lessons learned thread?`,
		tags: ['productivity', 'content-creation', 'lessons-learned'],
		createdAt: new Date(now - 30 * 60 * 1000), // 30 minutes ago
		updatedAt: new Date(now - 30 * 60 * 1000)
	});

	// Idea 4: Example with URL
	const idea4Id = uuidv7() as UuidV7;
	await db.insert(table.contentIdea).values({
		id: idea4Id,
		userId,
		oneLiner:
			'Interesting article about Zero https://zero.rocicorp.dev - local-first architecture deep dive',
		status: 'inbox',
		content: '',
		notes: `Key takeaways:
- Zero handles offline-first sync automatically
- Works with existing PostgreSQL databases
- Real-time multi-user collaboration
- Conflict resolution built in

Possible angles:
- Technical breakdown of how Zero works
- Comparison with other sync solutions
- Real-world use case (Refinery!)
- Performance considerations`,
		tags: ['technical', 'zero', 'local-first'],
		createdAt: new Date(now - 10 * 60 * 1000), // 10 minutes ago
		updatedAt: new Date(now - 10 * 60 * 1000)
	});
}
