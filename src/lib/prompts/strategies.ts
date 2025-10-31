import type { PromptStrategy } from './types';
import type { ContentIdea, ContentArtifact } from '$lib/zero/zero-schema.gen';

// Helper to format past artifacts as examples
function formatArtifactExamples(artifacts: ContentArtifact[], limit = 2): string {
	if (!artifacts || artifacts.length === 0) return '';

	const examples = artifacts
		.filter((a) => a.content && a.content.trim().length > 50)
		.slice(0, limit)
		.map((artifact, i) => {
			const preview = artifact.content!.substring(0, 500);
			return `### Your Past Example ${i + 1}:\n${preview}${artifact.content!.length > 500 ? '...' : ''}`;
		});

	if (examples.length === 0) return '';

	return `\n\n## YOUR AUTHENTIC VOICE - Past Examples\n\nHere are examples from your past ${artifacts[0]?.artifactType} content. Use these to match your authentic voice, tone, and style:\n\n${examples.join('\n\n')}\n\n---\n\n`;
}

// Helper to format past ideas as examples
function formatIdeaExamples(ideas: ContentIdea[], limit = 2): string {
	if (!ideas || ideas.length === 0) return '';

	const examples = ideas
		.filter((idea) => idea.content && idea.content.trim().length > 100)
		.slice(0, limit)
		.map((idea, i) => {
			const preview = idea.content!.substring(0, 400);
			return `### Past Idea ${i + 1}: ${idea.oneLiner}\n${preview}${idea.content!.length > 400 ? '...' : ''}`;
		});

	if (examples.length === 0) return '';

	return `\n\n## YOUR AUTHENTIC VOICE - Past Work\n\nHere are examples of how you typically develop ideas. Use these to match your authentic voice and thinking style:\n\n${examples.join('\n\n')}\n\n---\n\n`;
}

export const promptStrategies: PromptStrategy[] = [
	{
		id: 'convert-thread',
		name: 'Convert to Twitter Thread',
		description: 'Adapt your content into an engaging 8-10 tweet thread',
		category: 'adapt',
		icon: '🧵',
		requirements: {
			needsMasterContent: true // MUST have content
		},
		producesArtifact: true,
		artifactType: 'thread',
		generate: (ideaOrArtifact, settings, examples) => {
			const oneLiner = 'oneLiner' in ideaOrArtifact ? ideaOrArtifact.oneLiner : '';
			const notes = 'notes' in ideaOrArtifact ? ideaOrArtifact.notes : '';
			const contentSource = ideaOrArtifact.content || notes || oneLiner;

			const pastThreadExamples = formatArtifactExamples(
				examples?.pastArtifacts?.filter((a) => a.artifactType === 'thread') || [],
				2
			);

			return `Convert this content into an engaging Twitter thread (8-10 tweets maximum).

${settings?.brandVoice ? `Brand Voice: ${settings.brandVoice}\n\n` : ''}${pastThreadExamples}Original content:
${contentSource}

Requirements:
- **Tweet 1**: Strong hook that makes people want to read more (add 🧵 emoji)
- **Each tweet**: Self-contained but flows naturally to the next
- **Formatting**: Use short sentences, line breaks for readability
- **Final tweet**: Clear call-to-action (reply, follow, or share)
- **Tone**: ${settings?.brandVoice || 'Engaging and conversational'}
${pastThreadExamples ? '- **IMPORTANT**: Match the voice, structure, and style of the past examples above\n' : ''}
Format as:
1/X: [tweet content]
2/X: [tweet content]
...

Keep tweets under 280 characters. Make it easy to read on mobile.`;
		}
	},
	{
		id: 'engagement-comment',
		name: 'Write Engagement Comment',
		description: "Craft thoughtful, valuable comments for others' posts",
		category: 'engage',
		icon: '💬',
		requirements: {
			needsOneLiner: true
		},
		producesArtifact: false, // Utility prompt, not part of content pipeline
		generate: (ideaOrArtifact, settings) => {
			const oneLiner = 'oneLiner' in ideaOrArtifact ? ideaOrArtifact.oneLiner : '';
			const notes = 'notes' in ideaOrArtifact ? ideaOrArtifact.notes : '';
			return `Help me write an authentic, valuable comment for someone's post.

${settings?.uniquePerspective ? `My Unique Perspective: ${settings.uniquePerspective}\n\n` : ''}${settings?.contentPillars ? `My Content Focus Areas: ${settings.contentPillars}\n\n` : ''}Their post topic: ${oneLiner}

${notes ? `Additional context:\n${notes}\n\n` : ''}

Generate 3 different comment options:

1. **Insight-Adding Comment**
   - Add a related insight from my experience
   - Connect to my expertise areas
   - Provide additional value to the conversation

2. **Thoughtful Question Comment**
   - Ask a follow-up question that deepens the discussion
   - Show genuine curiosity
   - Encourage the author to elaborate

3. **Resource-Sharing Comment**
   - Share a relevant example, tool, or framework
   - Explain briefly why it's valuable
   - Keep it helpful, not promotional

Each comment should be:
- 2-3 sentences maximum
- Authentic and conversational
- Add real value (not just "Great post!")
- Professional yet approachable`;
		}
	},
	{
		id: 'technical-outline',
		name: 'Technical Deep-Dive Outline',
		description: 'Structure a comprehensive technical tutorial or explanation',
		category: 'structure',
		icon: '🔧',
		requirements: {
			needsOneLiner: true,
			needsMasterContent: false
		},
		producesArtifact: false,
		generate: (ideaOrArtifact, settings) => {
			const oneLiner = 'oneLiner' in ideaOrArtifact ? ideaOrArtifact.oneLiner : '';
			const notes = 'notes' in ideaOrArtifact ? ideaOrArtifact.notes : '';
			return `Create an outline for a technical deep-dive post.

Topic: ${oneLiner}
${settings?.targetAudience ? `Target Audience: ${settings.targetAudience}\n` : ''}${notes ? `Additional Context:\n${notes}\n\n` : ''}

Structure the outline with these sections:

1. **Hook** (Why This Matters)
   - What problem does this solve?
   - Why should readers care?
   - What will they learn?

2. **The Problem** (Context Setup)
   - Current challenges or pain points
   - Why existing solutions fall short
   - The gap this addresses

3. **The Solution** (3-4 Main Points)
   - Core concept or approach
   - Implementation details
   - Code examples or architecture diagrams
   - Best practices

4. **Common Pitfalls** (2-3 Things to Avoid)
   - Mistakes you or others have made
   - Edge cases to watch for
   - Performance or security considerations

5. **Conclusion & Next Steps**
   - Key takeaways
   - What to try next
   - Resources for deeper learning

For each section, include:
- Key points to cover
- Suggested examples or analogies
- Estimated word count

Target: 800-1200 word blog post or LinkedIn article.`;
		}
	},
	{
		id: 'general-outline',
		name: 'General Content Outline',
		description: 'Structure your thinking with a flexible framework for any content type',
		category: 'structure',
		icon: '📋',
		requirements: {
			needsOneLiner: true,
			needsMasterContent: false
		},
		producesArtifact: false,
		generate: (ideaOrArtifact, settings, examples) => {
			const oneLiner = 'oneLiner' in ideaOrArtifact ? ideaOrArtifact.oneLiner : '';
			const notes = 'notes' in ideaOrArtifact ? ideaOrArtifact.notes : '';

			const pastIdeaExamples = formatIdeaExamples(examples?.pastIdeas || [], 2);

			return `Help me develop this idea into a structured content outline.

Topic: ${oneLiner}

${notes ? `My Notes:\n${notes}\n\n` : ''}${settings?.targetAudience ? `Target Audience: ${settings.targetAudience}\n` : ''}${settings?.brandVoice ? `Brand Voice: ${settings.brandVoice}\n\n` : ''}${pastIdeaExamples}Create an outline that helps me develop my thinking:

**1. Core Message**
   - What's the ONE key insight I want readers to take away?
   - Why does this matter to them?
   - What makes this perspective unique or valuable?

**2. Opening Hook**
   - How can I grab attention in the first sentence?
   - What question, story, or statement will stop the scroll?
   - What emotion or curiosity should I trigger?

**3. Main Points to Develop** (3-5 key ideas)
   For each point, consider:
   - What's the specific insight or takeaway?
   - What example, data, or story supports this?
   - How does this connect to my reader's experience?
   - What questions might they have?

**4. Your Authentic Angle**
   - What's my personal experience with this?
   - What mistakes did I make or lessons did I learn?
   - What would I tell my younger self or a friend?
   - Where can I be vulnerable or contrarian?

**5. Actionable Takeaway**
   - What can readers DO with this information?
   - What's the next step they should take?
   - How can they apply this today?

**6. Call-to-Action**
   - What response do I want from readers?
   - Question for comments? Follow for more? Share their experience?
   - Keep it natural and conversational

${pastIdeaExamples ? '\n**IMPORTANT**: Look at how you naturally structure content in the examples above. Match that authentic style and depth.\n' : ''}
Focus on YOUR voice and authentic perspective. This is a thinking tool, not a template to fill.`;
		}
	},
	{
		id: 'founder-story',
		name: 'Founder Story Framework',
		description: 'Turn your experience into a relatable, engaging founder narrative',
		category: 'structure',
		icon: '📖',
		requirements: {
			needsOneLiner: true,
			needsMasterContent: false
		},
		producesArtifact: false,
		generate: (ideaOrArtifact, settings, examples) => {
			const oneLiner = 'oneLiner' in ideaOrArtifact ? ideaOrArtifact.oneLiner : '';
			const notes = 'notes' in ideaOrArtifact ? ideaOrArtifact.notes : '';

			const pastIdeaExamples = formatIdeaExamples(examples?.pastIdeas || [], 2);

			return `Help me structure a compelling founder story post.

Experience/Lesson: ${oneLiner}

${notes ? `Context:\n${notes}\n\n` : ''}${settings?.brandVoice ? `Brand Voice: ${settings.brandVoice}\n\n` : ''}${pastIdeaExamples}Use this proven framework:

1. **The Situation** (Set the Scene)
   - Where were you when this happened?
   - What were you working on?
   - Make it relatable and specific

2. **The Challenge** (What Went Wrong)
   - What obstacle did you face?
   - Why was it difficult?
   - How did it make you feel?

3. **The Turning Point** (The "Aha" Moment)
   - What changed your perspective?
   - What decision did you make?
   - What action did you take?

4. **The Outcome** (What Happened)
   - How did things turn out?
   - What were the results?
   - What did you learn?

5. **The Lesson** (Actionable Takeaway)
   - What should readers remember?
   - How can they apply this?
   - What would you do differently?

For each section, provide:
- Narrative hooks to grab attention
- Emotional beats to build connection
- Specific details that make it real
- Keep it authentic and vulnerable

Target: 400-600 words for LinkedIn. Make it personal but professional.`;
		}
	},
	{
		id: 'linkedin-carousel',
		name: 'LinkedIn Carousel',
		description: 'Convert your content into a 5-8 slide visual breakdown',
		category: 'adapt',
		icon: '🎠',
		requirements: {
			needsMasterContent: true // MUST have content
		},
		producesArtifact: true,
		artifactType: 'carousel',
		generate: (ideaOrArtifact, settings) => {
			const oneLiner = 'oneLiner' in ideaOrArtifact ? ideaOrArtifact.oneLiner : '';
			const notes = 'notes' in ideaOrArtifact ? ideaOrArtifact.notes : '';
			const contentSource = ideaOrArtifact.content || notes || oneLiner;

			return `Convert this content into a LinkedIn carousel (5-8 slides).

${settings?.brandVoice ? `Brand Voice: ${settings.brandVoice}\n\n` : ''}Original content:
${contentSource}

Requirements:
- **Slide 1 (Cover)**: Eye-catching title + hook that stops the scroll
  - Use a bold statement or question
  - Include a benefit or outcome
  - Keep it under 10 words

- **Slides 2-6 (Main Content)**: One key point per slide
  - Clear headline (5-8 words)
  - 2-3 supporting sentences or bullet points
  - Use simple language and short sentences
  - Include examples or data when relevant

- **Slide 7 (Recap)**: Quick summary of key takeaways
  - List 3-4 main points as bullets
  - Reinforce the value delivered

- **Slide 8 (CTA)**: Clear call to action
  - What should they do next?
  - Could be: follow, save, comment, visit link
  - Make it specific and actionable

Design tips:
- Each slide should work standalone but flow logically
- Use consistent formatting throughout
- Keep text minimal - this is visual content
- Write for mobile (most LinkedIn users)

Format each slide clearly:
SLIDE 1:
[Title]
[Subtitle/Hook]

SLIDE 2:
[Headline]
[Supporting points]
...`;
		}
	},
	{
		id: 'short-linkedin-post',
		name: 'Short LinkedIn Post',
		description: 'Distill your content into a < 1300 character mobile-optimized post',
		category: 'adapt',
		icon: '📱',
		requirements: {
			needsMasterContent: true // MUST have content
		},
		producesArtifact: true,
		artifactType: 'short-post',
		generate: (ideaOrArtifact, settings, examples) => {
			const oneLiner = 'oneLiner' in ideaOrArtifact ? ideaOrArtifact.oneLiner : '';
			const notes = 'notes' in ideaOrArtifact ? ideaOrArtifact.notes : '';
			const contentSource = ideaOrArtifact.content || notes || oneLiner;

			const pastPostExamples = formatArtifactExamples(
				examples?.pastArtifacts?.filter((a) => a.artifactType === 'short-post') || [],
				2
			);

			return `Convert this content into a short, punchy LinkedIn post (under 1300 characters).

${settings?.brandVoice ? `Brand Voice: ${settings.brandVoice}\n\n` : ''}${pastPostExamples}Original content:
${contentSource}

Requirements:
- **Hook** (First 1-2 lines): Stop the scroll
  - Use a question, bold statement, or surprising fact
  - Make it relatable to your target audience
  - No fluff - get straight to the point

- **Body** (3-5 short paragraphs):
  - ONE main idea or insight
  - Use line breaks between paragraphs for readability
  - Include a personal angle or example
  - Keep paragraphs to 1-2 sentences each

- **Call-to-Action**:
  - Ask a question to drive comments
  - OR invite them to share their experience
  - OR simple "Follow for more on [topic]"

Formatting tips:
- Use emojis sparingly (1-2 max) if they fit the voice
- NO hashtag spam - 2-3 relevant hashtags at most
- Write for mobile - short lines, easy to scan
- Front-load the value - assume they'll only read the first 3 lines

Tone: ${settings?.brandVoice || 'Professional but conversational, like talking to a colleague'}
${pastPostExamples ? '**IMPORTANT**: Match the voice, formatting, and style of the past examples above\n\n' : ''}
Maximum length: 1300 characters (LinkedIn shows "see more" after this)
Aim for: 800-1200 characters for optimal engagement`;
		}
	},
	{
		id: 'newsletter-format',
		name: 'Newsletter Format',
		description: 'Adapt your content into an email-optimized newsletter section',
		category: 'adapt',
		icon: '📧',
		requirements: {
			needsMasterContent: true // MUST have content
		},
		producesArtifact: true,
		artifactType: 'newsletter',
		generate: (ideaOrArtifact, settings) => {
			const oneLiner = 'oneLiner' in ideaOrArtifact ? ideaOrArtifact.oneLiner : '';
			const notes = 'notes' in ideaOrArtifact ? ideaOrArtifact.notes : '';
			const contentSource = ideaOrArtifact.content || notes || oneLiner;

			return `Convert this content into an email newsletter section.

${settings?.brandVoice ? `Brand Voice: ${settings.brandVoice}\n\n` : ''}Original content:
${contentSource}

Format for email (scannable and engaging):

**Subject Line** (40-50 characters)
- Curiosity-driven or benefit-focused
- Personable, not corporate
- Avoid spam triggers (NO: FREE, !!!, URGENT)
- Example: "Why [common belief] is costing you [outcome]"

**Preview Text** (35-55 characters)
- Complements the subject line
- Adds context or intrigue
- Shows in inbox preview

**Opening** (1-2 sentences)
- Personal greeting tone
- Jump straight into the value
- No "Hope this email finds you well" corporate speak

**Main Content** (200-400 words)
Structure:
- Use short paragraphs (2-3 sentences)
- Add white space - email needs MORE breaks than web
- Bold key phrases for scanning
- Use a conversational tone (write like you're emailing a friend)

Section breakdown:
1. The Hook: Why this matters today
2. The Insight: Your main point with supporting example
3. The Action: What they should do with this info

**Closing**
- Quick summary or key takeaway
- Warm sign-off (match your brand voice)
- Single, clear CTA button or link

**CTA Options**:
- Read the full article →
- Reply with your thoughts
- Share this with a friend
- Try this [tool/method]

Email-specific tips:
- Write for mobile-first (60%+ open on mobile)
- Keep links to 2-3 max (too many = spam folder)
- Personal tone - write "you" not "users" or "people"
- Test: Would you send this to a friend? If not, rewrite.
- Tone: ${settings?.brandVoice || 'Helpful friend, not faceless brand'}

Include plain text version suggestion (simplified formatting for text-only email clients).`;
		}
	},
	{
		id: 'bluesky-thread',
		name: 'Bluesky Thread',
		description: "Adapt your content for Bluesky's authentic, early-adopter community",
		category: 'adapt',
		icon: '🦋',
		requirements: {
			needsMasterContent: true // MUST have content
		},
		producesArtifact: true,
		artifactType: 'thread',
		generate: (ideaOrArtifact, settings) => {
			const oneLiner = 'oneLiner' in ideaOrArtifact ? ideaOrArtifact.oneLiner : '';
			const notes = 'notes' in ideaOrArtifact ? ideaOrArtifact.notes : '';
			const contentSource = ideaOrArtifact.content || notes || oneLiner;

			return `Convert this content into a Bluesky thread (6-10 posts).

${settings?.brandVoice ? `Brand Voice: ${settings.brandVoice}\n\n` : ''}Original content:
${contentSource}

Bluesky-specific approach:
- More authentic and less polished than Twitter
- Tech-savvy, early-adopter audience
- Values transparency and "building in public"
- Less corporate, more human
- Community over broadcasting

**Post 1** (The Hook):
- Start with a genuine insight or experience
- No "thread 🧵" needed - Bluesky handles threading UI
- Be direct and relatable
- Show your perspective, not just facts

**Posts 2-8** (The Content):
- Each post: 1-2 key points
- Use your natural voice - write how you'd explain to a colleague
- Share the "why" behind your thinking
- It's okay to be unfinished or exploratory
- Technical details are welcomed (this audience gets it)
- Show your work - screenshots, code snippets, rough diagrams

**Post 9** (The Insight):
- What you learned or concluded
- Connect back to the opening
- Can be a question or an observation
- Authenticity > polish

**Post 10** (Optional Closer):
- Invite conversation: "What's your experience with this?"
- Could share what you're working on next
- NO hard sell - this community values genuine interaction

Tone differences from Twitter:
- ✅ "I'm still figuring this out, but here's what I've learned so far"
- ✅ "Made this mistake today. Here's what I learned"
- ✅ Technical deep-dives with actual uncertainty
- ❌ Hustle culture "10x your productivity" framing
- ❌ Over-polished marketing speak
- ❌ Engagement bait tactics

Bluesky formatting:
- 300 character limit per post (vs Twitter's 280)
- Can use more natural formatting
- Code blocks and links work well
- Community appreciates alt text on images

Voice: ${settings?.brandVoice || 'Authentic, thoughtful, and human - like talking to fellow builders'}

Remember: Bluesky values substance over virality. Write for depth and genuine connection.`;
		}
	},
	{
		id: 'refine-hook',
		name: 'Stronger Opening Hook',
		description: 'Make the opening more compelling and attention-grabbing',
		category: 'refine',
		icon: '🪝',
		requirements: {},
		producesArtifact: false,
		targetArtifactTypes: ['thread', 'blog-post', 'short-post'],
		generate: (artifactOrIdea, settings) => {
			const content =
				artifactOrIdea.content || ('oneLiner' in artifactOrIdea ? artifactOrIdea.oneLiner : '');
			const type = 'artifactType' in artifactOrIdea ? artifactOrIdea.artifactType : 'content';

			return `Improve the opening hook of this ${type}.

${settings?.brandVoice ? `Brand Voice: ${settings.brandVoice}\n\n` : ''}Current content:
${content}

Make the opening:
- More attention-grabbing
- Create curiosity or surprise
- Relevant to the target audience
- Promise clear value
${type === 'thread' ? '- Work within 280 character limit for tweet 1' : ''}
${type === 'blog-post' ? '- SEO-friendly while engaging' : ''}

Provide 3 alternative opening hooks, each with a different approach:
1. Question-based hook
2. Bold statement/contrarian take
3. Story/scenario-based hook

For each, explain why it works and what emotion it triggers.`;
		}
	},
	{
		id: 'refine-shorter',
		name: 'Make It Shorter',
		description: 'Condense content while keeping the core message',
		category: 'refine',
		icon: '✂️',
		requirements: {},
		producesArtifact: false,
		targetArtifactTypes: ['thread', 'short-post', 'blog-post', 'newsletter'],
		generate: (artifactOrIdea, settings) => {
			const content = artifactOrIdea.content || '';
			const type = 'artifactType' in artifactOrIdea ? artifactOrIdea.artifactType : 'content';

			return `Condense this ${type} while preserving the core message and value.

Current content:
${content}

Guidelines:
- Remove redundant explanations
- Cut filler words and phrases
- Keep only the most impactful points
- Maintain the original tone and voice
${type === 'thread' ? '- Reduce tweet count by 30-40%' : ''}
${type === 'short-post' ? '- Aim for under 1000 characters' : ''}
${type === 'blog-post' ? '- Reduce by 25-30% without losing substance' : ''}

Provide the condensed version that is:
- Punchy and to-the-point
- Easier to scan
- More mobile-friendly
- Still complete and valuable

${settings?.brandVoice ? `Maintain brand voice: ${settings.brandVoice}` : ''}`;
		}
	},
	{
		id: 'refine-cta',
		name: 'Add/Improve Call-to-Action',
		description: 'Create a compelling CTA that drives engagement',
		category: 'refine',
		icon: '🎯',
		requirements: {},
		producesArtifact: false,
		targetArtifactTypes: ['thread', 'blog-post', 'short-post', 'newsletter', 'email'],
		generate: (artifactOrIdea, settings) => {
			const content = artifactOrIdea.content || '';
			const type = 'artifactType' in artifactOrIdea ? artifactOrIdea.artifactType : 'content';

			return `Add or improve the call-to-action for this ${type}.

Current content:
${content}

Create 3 different CTA options:

1. **Engagement CTA** - Drives comments/replies
   - Ask a thought-provoking question
   - Invite them to share their experience
   - Create discussion

2. **Action CTA** - Gets them to do something
   - Try a tool/method
   - Read related content
   - Download/save for later

3. **Relationship CTA** - Builds connection
   - Follow for more insights
   - Subscribe/join community
   - Connect for collaboration

For each CTA:
- Make it specific and clear
- Align with the content value
- Feel natural, not salesy
- Match the platform (${type})
${type === 'thread' ? '- Fit in final tweet (280 chars)' : ''}

${settings?.brandVoice ? `Brand voice: ${settings.brandVoice}` : ''}`;
		}
	},
	{
		id: 'refine-engagement',
		name: 'Boost Engagement',
		description: 'Make content more interactive and conversation-starting',
		category: 'refine',
		icon: '💬',
		requirements: {},
		producesArtifact: false,
		targetArtifactTypes: ['thread', 'short-post', 'carousel'],
		generate: (artifactOrIdea, settings) => {
			const content = artifactOrIdea.content || '';
			const type = 'artifactType' in artifactOrIdea ? artifactOrIdea.artifactType : 'content';

			return `Make this ${type} more engaging and conversation-starting.

Current content:
${content}

Techniques to apply:
1. **Add Questions** - Strategic questions throughout that make people think
2. **Personal Touches** - Add "you" language, make it relatable
3. **Controversy/Debate** - Include a slightly contrarian take (backed up)
4. **Story Elements** - Add micro-stories or examples people can relate to
5. **Call-Outs** - "If you've ever..." or "Here's what nobody tells you..."

Provide the enhanced version with:
- More conversational tone
- Strategic questions placed throughout
- Relatable examples or scenarios
- Language that invites response
${type === 'thread' ? '- Engagement tactics in key tweets' : ''}
${type === 'carousel' ? '- Questions on slides 3, 5, and closing slide' : ''}

${settings?.brandVoice ? `Maintain brand voice: ${settings.brandVoice}` : ''}

Goal: Triple the reply/comment rate while staying authentic.`;
		}
	},
	{
		id: 'refine-data',
		name: 'Add Data & Examples',
		description: 'Strengthen with specific data points and concrete examples',
		category: 'refine',
		icon: '📊',
		requirements: {},
		producesArtifact: false,
		targetArtifactTypes: ['blog-post', 'thread', 'short-post', 'newsletter'],
		generate: (artifactOrIdea) => {
			const content = artifactOrIdea.content || '';
			const type = 'artifactType' in artifactOrIdea ? artifactOrIdea.artifactType : 'content';

			return `Enhance this ${type} with data, examples, and concrete proof points.

Current content:
${content}

Add credibility through:

1. **Specific Data Points**
   - Statistics (with sources)
   - Percentages and numbers
   - Before/after comparisons
   - Industry benchmarks

2. **Concrete Examples**
   - Real company/product names
   - Specific scenarios
   - Case study snippets
   - Your own results/experiences

3. **Visual Suggestions**
   - Where charts/graphs would help
   - Screenshot opportunities
   - Diagram suggestions

Guidelines:
- Replace vague claims with specific numbers
- Add "according to [source]" where relevant
- Include at least 2-3 concrete examples
- Make data easy to scan (bold numbers, bullets)
${type === 'blog-post' ? '- Suggest where to add infographics' : ''}
${type === 'thread' ? '- One data point per tweet for impact' : ''}

Provide:
- Enhanced content with data integrated naturally
- List of suggested data sources to verify
- Notes on where visuals would strengthen the message`;
		}
	},
	{
		id: 'refine-seo',
		name: 'Optimize for SEO',
		description: 'Improve search visibility and discoverability',
		category: 'refine',
		icon: '🔍',
		requirements: {},
		producesArtifact: false,
		targetArtifactTypes: ['blog-post'],
		generate: (artifactOrIdea) => {
			const content = artifactOrIdea.content || '';

			return `Optimize this blog post for search engines while maintaining quality.

Current content:
${content}

SEO Improvements:

1. **Title Optimization**
   - Include target keyword naturally
   - 50-60 characters
   - Benefit-driven
   - Suggest 3 title variations

2. **Meta Description**
   - 150-160 characters
   - Include keyword
   - Compelling preview
   - Clear value proposition

3. **Content Structure**
   - H2/H3 headings with keywords
   - First paragraph with keyword
   - Natural keyword density (1-2%)
   - Related keywords/synonyms

4. **Internal Linking**
   - Suggest 3-5 internal link opportunities
   - Anchor text suggestions
   - Topic clusters

5. **External Linking**
   - Authoritative sources to link
   - Data/research citations
   - Builds credibility

6. **Featured Snippet Opportunities**
   - Where to add bullet/numbered lists
   - FAQ section suggestions
   - Quick answer paragraphs

Provide:
- Optimized version of content
- Primary + 3-5 related keywords
- Meta description
- 3 title options
- Internal/external link suggestions

Keep content natural and valuable-first, SEO second.`;
		}
	}
];

export function getStrategyById(id: string): PromptStrategy | undefined {
	return promptStrategies.find((s) => s.id === id);
}

export function getStrategiesByCategory(category: PromptStrategy['category']): PromptStrategy[] {
	return promptStrategies.filter((s) => s.category === category);
}
