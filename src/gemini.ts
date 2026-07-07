 export async function generateLinkedInPostFromAI(topic: string, style: string) {
  const cleanTopic = topic ? topic.trim() : "Generative AI";
  const hashtag = cleanTopic.replace(/\s+/g, '');

  // 1. Justin Welsh Framework (Minimalist, data lines, short punchy statements)
  if (style === "Justin Welsh Style") {
    return `LinkedIn creators are obsessed with templates.
But 99% of them forget how ${cleanTopic} actually scales.

Here is the exact framework I use for ${cleanTopic}:

1. Stop focusing on static layouts.
2. Build robust data-driven features early.
3. Keep shipping in public to find loops.

The result? Better clarity, zero waste, compound metrics.

If you aren't doing this in 2026, you're falling behind.

#${hashtag} #Solopreneur #Systems`;
  }

  // 2. Deep Storytelling Framework (Broetry format, emotional/personal shift hook)
  if (style === "Deep Storytelling") {
    return `Years ago, I thought ${cleanTopic} was just another buzzword.

I watched everyone talk about it, but nobody was executing.
Then last night, everything clicked.

I realized three brutal truths about ${cleanTopic}:

• Strategy is cheap. High-intent loops are expensive.
• True automated channels beat perfect planning every time.
• Moving from static architectures to dynamic features is where the money is.

Don't build for the algorithms. Build for the execution.

What's your biggest roadblock with ${cleanTopic} right now? Let's fix it below.

#${hashtag} #Storytelling #Mindset`;
  }

  // 3. Corporate Professional Style
  if (style === "Corporate Professional") {
    return `🎯 Executive Insights: Optimizing organizational efficiency with ${cleanTopic}.

As we map out deliverables for 2026, integration of ${cleanTopic} is no longer optional—it is a core business necessity. Key milestones include:

• Mitigating static vulnerabilities via automated systems.
• Transitioning infrastructure towards highly adaptive, scalable models.
• Enhancing cross-functional visibility through public-facing iteration.

How is your enterprise capitalizing on ${cleanTopic} this quarter? Let's connect.

#${hashtag} #CorporateStrategy #Innovation`;
  }

  // 4. Default: Insightful Essay
  return `🚀 The Future of ${cleanTopic} | Premium Release

When tracking developments in ${cleanTopic}, true growth comes from pure, unadulterated execution rather than theoretical frameworks.

Key take-aways for modern builders:
- Shift from legacy infrastructure to robust, cloud-driven layers.
- Implement automated workflows to cut latency by 40%.
- Maintain feedback velocity by building and shipping in public.

#${hashtag} #TechTrends #NextGen`;
}