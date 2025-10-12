import type { PromptStrategy } from './types';

export const promptStrategies: PromptStrategy[] = [
	{
		id: 'expand-full-post',
		name: 'Expand to Full Post',
		description: 'Turn your one-liner into 3 different approaches (technical, story, actionable)',
		category: 'expand',
		icon: '📝',
		requirements: {
			needsOneLiner: true,
			needsMasterContent: false // Should NOT have content yet
		},
		producesArtifact: false, // Updates idea.content field
		generate: (idea, settings) => {
			const hasSettings =
				settings &&
				(settings.targetAudience ||
					settings.brandVoice ||
					settings.contentPillars ||
					settings.uniquePerspective);

			if (hasSettings) {
				return `You are a professional content writer creating content for ${settings.targetAudience || 'your audience'}.

Brand Voice: ${settings.brandVoice || 'Professional and engaging'}
Content Focus Areas: ${settings.contentPillars || 'Your expertise areas'}
Unique Value: ${settings.uniquePerspective || 'High-quality insights'}

Your one-liner idea: "${idea.oneLiner}"

${idea.notes ? `Additional context and notes:\n${idea.notes}\n\n` : ''}

Create 3 different approaches to expand this idea into a full post:

1. **Technical Deep-Dive Approach**
   - Explain how it works under the hood
   - Include implementation details or architecture
   - Focus on the "why" behind technical decisions

2. **Founder Story Approach**
   - Share personal experience with this topic
   - What you learned, mistakes made, lessons gained
   - Make it relatable and vulnerable

3. **Actionable Tips Approach**
   - Practical steps readers can apply today
   - Focus on concrete takeaways
   - Include specific examples or frameworks

For each approach, provide:
- **Hook**: Compelling first 2 sentences to grab attention
- **Main Points**: 3-4 key points with supporting details
- **Call-to-Action**: Clear next step for the reader

Keep each approach under 300 words (LinkedIn-ready). Match the brand voice described above and ensure content connects to your stated content focus areas.`;
			}

			// Fallback if no settings
			return `You are a professional content writer.

Your one-liner idea: "${idea.oneLiner}"

${idea.notes ? `Additional context and notes:\n${idea.notes}\n\n` : ''}

Create 3 different approaches to expand this idea into a full post:

1. **Technical Deep-Dive Approach** - Explain implementation and architecture
2. **Story-Based Approach** - Share personal experience and lessons learned
3. **Actionable Tips Approach** - Practical steps readers can apply

For each approach, provide a compelling hook, 3-4 main points, and a call-to-action. Keep each under 300 words.`;
		}
	},
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
		generate: (idea, settings) => {
			const contentSource = idea.content || idea.notes || idea.oneLiner;

			return `Convert this content into an engaging Twitter thread (8-10 tweets maximum).

${settings?.brandVoice ? `Brand Voice: ${settings.brandVoice}\n\n` : ''}Original content:
${contentSource}

Requirements:
- **Tweet 1**: Strong hook that makes people want to read more (add 🧵 emoji)
- **Each tweet**: Self-contained but flows naturally to the next
- **Formatting**: Use short sentences, line breaks for readability
- **Final tweet**: Clear call-to-action (reply, follow, or share)
- **Tone**: ${settings?.brandVoice || 'Engaging and conversational'}

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
		generate: (idea, settings) => {
			return `Help me write an authentic, valuable comment for someone's post.

${settings?.uniquePerspective ? `My Unique Perspective: ${settings.uniquePerspective}\n\n` : ''}${settings?.contentPillars ? `My Content Focus Areas: ${settings.contentPillars}\n\n` : ''}Their post topic: ${idea.oneLiner}

${idea.notes ? `Additional context:\n${idea.notes}\n\n` : ''}

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
		category: 'expand',
		icon: '🔧',
		requirements: {
			needsOneLiner: true,
			needsMasterContent: false
		},
		producesArtifact: false,
		generate: (idea, settings) => {
			return `Create an outline for a technical deep-dive post.

Topic: ${idea.oneLiner}
${settings?.targetAudience ? `Target Audience: ${settings.targetAudience}\n` : ''}${idea.notes ? `Additional Context:\n${idea.notes}\n\n` : ''}

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
		id: 'founder-story',
		name: 'Founder Story Framework',
		description: 'Turn your experience into a relatable, engaging founder narrative',
		category: 'expand',
		icon: '📖',
		requirements: {
			needsOneLiner: true,
			needsMasterContent: false
		},
		producesArtifact: false,
		generate: (idea, settings) => {
			return `Help me structure a compelling founder story post.

Experience/Lesson: ${idea.oneLiner}

${idea.notes ? `Context:\n${idea.notes}\n\n` : ''}${settings?.brandVoice ? `Brand Voice: ${settings.brandVoice}\n\n` : ''}Use this proven framework:

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
	}
];

export function getStrategyById(id: string): PromptStrategy | undefined {
	return promptStrategies.find((s) => s.id === id);
}

export function getStrategiesByCategory(category: PromptStrategy['category']): PromptStrategy[] {
	return promptStrategies.filter((s) => s.category === category);
}
