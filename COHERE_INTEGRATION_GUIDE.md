# Cohere AI Integration Guide

## Overview
This guide explains how to set up and use Cohere AI for enhanced chatbot responses in the Todo application.

## Why Cohere?
Cohere provides advanced natural language processing capabilities that can improve:
- Intent recognition accuracy
- Contextual understanding
- Response quality and relevance
- Handling of complex user queries

## Getting a Cohere API Key

1. Visit [Cohere Dashboard](https://dashboard.cohere.com/api-keys)
2. Sign up for an account or log in if you already have one
3. Navigate to the "API Keys" section
4. Click "Create API Key"
5. Give your key a name (e.g., "todo-chatbot")
6. Copy the generated API key and save it securely

**Note**: Keep your API key private and never commit it to version control.

## Recommended Models

### Command R
- **Model**: `command-r`
- **Best for**: Complex reasoning, multi-step tasks, factual QA
- **Use case**: Enhanced chatbot responses with deep understanding
- **Cost**: Higher cost but superior quality

### Command A (Updated Recommendation)
- **Model**: `command-a-03-2025` (Currently recommended as of March 2025)
- **Best for**: Complex reasoning, multi-step tasks, factual QA
- **Use case**: Enhanced chatbot responses with deep understanding
- **Cost**: Higher cost but superior quality

## Configuration

### Environment Variables
Update your `.env` file with the following:

```env
# Cohere API Key
COHERE_API_KEY=your-api-key-here

# Model selection (defaults to command-r-plus)
COHERE_MODEL=command-r-plus

# Temperature setting (0.0-1.0, higher = more creative)
COHERE_TEMPERATURE=0.7
```

### Fallback Configuration
The system includes a fallback to rule-based parsing if Cohere is unavailable:
- If COHERE_API_KEY is not set, falls back to rule-based parsing
- If Cohere API fails, falls back to rule-based parsing
- Maintains full functionality in all scenarios

## Installation

1. Install the Cohere library:
   ```bash
   pip install cohere
   ```

2. Update your requirements.txt:
   ```txt
   cohere>=4.0.0
   ```

3. Restart your application

## Best Practices

### 1. Rate Limiting
- Monitor your API usage through the Cohere dashboard
- Implement appropriate caching for frequently asked questions
- Consider using shorter contexts when possible

### 2. Error Handling
- The system automatically falls back to rule-based parsing
- Log Cohere API errors for monitoring
- Implement retry logic for transient failures

### 3. Security
- Never expose API keys in client-side code
- Use environment variables for configuration
- Regularly rotate API keys

## Performance Tuning

### Temperature Settings
- **0.0-0.3**: Deterministic, factual responses
- **0.4-0.7**: Balanced creativity and accuracy (recommended)
- **0.8-1.0**: Creative, exploratory responses

### Context Management
- Limit conversation history to 50 messages to maintain performance
- Use summarization for long-running conversations
- Implement sliding window for context preservation

## Troubleshooting

### Common Issues

1. **"Cohere API Key not found"**
   - Verify COHERE_API_KEY is set in environment
   - Check for typos in the key
   - Ensure environment is loaded properly

2. **High latency responses**
   - Check internet connectivity
   - Verify API key validity
   - Consider using a model closer to your region

3. **Unexpected responses**
   - Adjust temperature settings
   - Review prompt engineering
   - Consider model selection

### Monitoring
- Track API usage and costs
- Monitor response times
- Log error rates and types
- Watch for degradation in response quality

## Migration from OpenAI (if applicable)

If you were previously using OpenAI:
1. Set your COHERE_API_KEY in environment
2. Optionally remove OPENAI_API_KEY if not needed as fallback
3. Update model selection as needed
4. Test thoroughly before deploying to production

## Cost Optimization

1. **Token Usage**: Monitor token consumption through Cohere dashboard
2. **Caching**: Cache responses for common queries
3. **Model Selection**: Use appropriate model for each use case
4. **Rate Limits**: Implement smart retry logic to avoid rate limiting

## Support and Resources

- [Cohere Documentation](https://docs.cohere.com/)
- [API Reference](https://docs.cohere.com/reference/chat)
- [Community Forum](https://community.cohere.com/)
- [Support Portal](https://support.cohere.com/)

For application-specific issues, contact the development team.