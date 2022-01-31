using System;
using System.IO;
using System.Text;

namespace backend.Communication
{
    public class JsonObjectStringReader
    {
        private readonly char OBJECT_BEGIN = '{';
        private readonly char OBJECT_END = '}';
        private readonly char STRING_DELIM = '"';
        private readonly char STRING_ESCAPE = '\\';

        private Stream stream;
        private byte[] buffer;
        private int remainingData;

        public JsonObjectStringReader(Stream inputStream, int bufferSize = 1024)
        {
            stream = inputStream;
            buffer = new byte[bufferSize];
        }

        public string NextJsonObject()
        {
            int received = remainingData;
            
            var state = ReaderState.Clear;
            var builder = new StringBuilder();

            int depth = 0;
            char lastChar = '\0'; // for detecting escaped string ends

            do
            {
                if (received == 0)
                    received = stream.Read(buffer, 0, buffer.Length);
                string part = Encoding.UTF8.GetString(buffer, 0, received);
                // Since JSON syntax characters don't use surrogate pairs, we can just
                // loop through all the chars here, representing single UTF-16 code units.
                for (int i = 0; i < part.Length; i++)
                {
                    char c = part[i];
                    builder.Append(c);
                    switch (state)
                    {
                        case ReaderState.Clear:
                        {
                            if (Char.IsWhiteSpace(c))
                                break; // Skip whitespaces between objects.
                            if (OBJECT_BEGIN != c)
                                throw new InvalidDataException("Expected start of a JSON object.");
                            depth++;
                            state = ReaderState.InObject;
                            break;
                        }
                        case ReaderState.InObject:
                        {
                            if (STRING_DELIM == c)
                            {
                                state = ReaderState.InString;
                            }
                            else if (OBJECT_BEGIN == c)
                            {
                                depth++;
                            }
                            else if (OBJECT_END == c)
                            {
                                depth--;
                                if (depth == 0)
                                {
                                    remainingData = 
                                        i < part.Length - 1 ?
                                            Encoding.UTF8.GetByteCount(part.Substring(i + 1)) :
                                            0;
                                    // Save remaining data by copying it to the front of the buffer.
                                    Array.Copy(buffer, received - remainingData, buffer, 0, remainingData);
                                    Console.WriteLine(builder.ToString());
                                    return builder.ToString();
                                }
                            }
                            break;
                        }
                        case ReaderState.InString:
                        {
                            if (STRING_DELIM == c && STRING_ESCAPE != lastChar)
                            {
                                state = ReaderState.InObject;
                            }
                            break;
                        }
                    }
                    lastChar = c;
                }
                received = 0;
            } while (stream.CanRead);

            throw new InvalidDataException("Unexpected end of stream.");
        }

        private enum ReaderState
        {
            Clear,
            InObject,
            InString
        }
    }
}