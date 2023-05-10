"use client";

import * as React from "react";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { SSE } from "sse.js";
import type { CreateCompletionResponse } from "openai";
import { Loader, User } from "lucide-react";
import { supabase } from "./../lib/supabase";

function promptDataReducer(
  state: any[],
  action: {
    index?: number;
    answer?: string | undefined;
    status?: string;
    query?: string | undefined;
    type?: "remove-last-item" | string;
  }
) {
  // set a standard state to use later
  const current = [...state];

  if (action.type) {
    switch (action.type) {
      case "remove-last-item":
        current.pop();
        return [...current];
      default:
        break;
    }
  }

  // check that an index is present
  if (action.index === undefined) return [...state];

  if (!current[action.index]) {
    current[action.index] = { query: "", answer: "", status: "" };
  }

  current[action.index].answer = action.answer;

  if (action.query) {
    current[action.index].query = action.query;
  }
  if (action.status) {
    current[action.index].status = action.status;
  }

  return [...current];
}

export function SearchDialog() {
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const [search, setSearch] = React.useState<string>("");
  const [answer, setAnswer] = React.useState<string | undefined>("");
  const eventSourceRef = React.useRef<SSE>();
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [promptIndex, setPromptIndex] = React.useState(0);
  const [promptData, dispatchPromptData] = React.useReducer(
    promptDataReducer,
    []
  );
  const [message, setMessage] = React.useState<
    { message: string; bot: boolean; user: boolean }[]
  >([]);
  const currentAnswerRef = React.useRef<string>("");
  const currentQuestionRef = React.useRef<string>("");

  const handleConfirm = React.useCallback(
    async (query: string) => {
      if (bottomRef.current) {
        bottomRef.current.scrollTop = bottomRef.current.scrollHeight;
      }
      setAnswer(undefined);
      setSearch("");
      dispatchPromptData({ index: promptIndex, answer: undefined, query });
      setHasError(false);
      setIsLoading(true);

      const eventSource = new SSE(
        `https://app.supahuman.xyz/api/vector-search`,
        {
          headers: {
            apikey:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmbnByYWZ0cmp6cGxqYWdyemppIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODMxODQwMDgsImV4cCI6MTk5ODc2MDAwOH0.u1gViHf4swTg8ftqIC8zcSmKFF8Utx9OSMYqZfeL6Aw",
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmbnByYWZ0cmp6cGxqYWdyemppIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODMxODQwMDgsImV4cCI6MTk5ODc2MDAwOH0.u1gViHf4swTg8ftqIC8zcSmKFF8Utx9OSMYqZfeL6Aw`,
            "Content-Type": "application/json",
          },
          payload: JSON.stringify({ query }),
        }
      );

      function handleError<T>(err: T) {
        setIsLoading(false);
        setHasError(true);
        console.error(err);
      }

      eventSource.addEventListener("error", handleError);
      eventSource.addEventListener("message", (e: any) => {
        try {
          setIsLoading(false);
          if (e.data === "[DONE]") {
            setPromptIndex((x) => {
              return x + 1;
            });
            if (currentAnswerRef.current) {
              setMessage([
                ...message,
                { message: currentQuestionRef.current, bot: false, user: true },
                { message: currentAnswerRef.current, bot: true, user: false },
              ]);
              insertUserResponse(
                currentQuestionRef.current,
                currentAnswerRef.current
              );
            }

            return;
          }

          const completionResponse: CreateCompletionResponse = JSON.parse(
            e.data
          );
          const text = completionResponse.choices[0].text;
          setAnswer((answer) => {
            const updatedAnswer = (answer ?? "") + text;
            currentAnswerRef.current = updatedAnswer;
            dispatchPromptData({
              index: promptIndex,
              answer: updatedAnswer,
            });
            return updatedAnswer;
          });
          if (bottomRef.current) {
            bottomRef.current.scrollTop = bottomRef.current.scrollHeight;
          }
        } catch (err) {
          handleError(err);
        }
      });

      eventSource.stream();

      eventSourceRef.current = eventSource;

      setIsLoading(true);
    },
    [promptIndex, promptData]
  );

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    setMessage([...message, { message: search, bot: false, user: true }]);
    currentQuestionRef.current = search;
    if (bottomRef.current) {
      bottomRef.current.scrollTop = bottomRef.current.scrollHeight;
    }
    handleConfirm(search);
  };

  async function insertUserResponse(query: string, response: string) {
    console.log("I am in the insert user function");
    console.log("Query:", query);
    console.log("Response:", response);
    setAnswer("");

    try {
      const { data, error } = await supabase.from("user_response").insert([
        {
          query: query,
          response: response,
          created_at: new Date(),
        },
      ]);

      console.log("Data:", data);
      console.log("Error:", error);

      if (error) {
        console.error("Error inserting user response:", error);
      } else {
        console.log("User response inserted successfully:", data);
      }
    } catch (error) {
      console.error("Error inserting user response:", error);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="h-[500px] w-96 shadow-lg rounded-md absolute bottom-24 right-5 p-4 bg-gray-50">
          <div className="relative h-full">
            <div className="flex justify-start gap-2 items-center border-b-2 pb-2 mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-8 h-8 bg-gray-950 rounded-full text-white p-2"
              >
                <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
                <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
              </svg>
              <p className="font-bold">Chatbot</p>
            </div>
            <div
              className="h-96 overflow-y-auto flex flex-col gap-4"
              ref={bottomRef}
            >
              <div className="flex gap-2 justify-start items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-8 h-8 bg-gray-950 rounded-full text-white p-2"
                >
                  <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
                  <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
                </svg>
                <div className="bg-gray-200 p-3 rounded-lg mr-16">
                  Hi i am AI bot how can i help you
                </div>
              </div>
              {message.map((oldQ, i) => {
                if (oldQ.user) {
                  return (
                    <div
                      className="flex gap-2 justify-end items-center"
                      key={i}
                    >
                      <div className="bg-gray-200 p-3 rounded-lg ml-16">
                        {oldQ.message}
                      </div>
                      <span className="bg-slate-100 dark:bg-slate-300 p-2 w-8 h-8 rounded-full text-center flex items-center justify-center">
                        <User width={18} />
                      </span>
                    </div>
                  );
                } else {
                  return (
                    <div className="flex gap-2 justify-start" key={`${i} a`}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-8 h-8 bg-gray-950 rounded-full text-white p-2 flex-shrink-0"
                      >
                        <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
                        <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
                      </svg>
                      <div className="bg-gray-200 p-3 rounded-lg mr-16">
                        {oldQ.message}
                      </div>
                    </div>
                  );
                }
              })}
              {(isLoading || answer || hasError) && (
                <div className="flex gap-2 justify-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-8 h-8 bg-gray-950 rounded-full text-white p-2 flex-shrink-0"
                  >
                    <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
                    <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
                  </svg>
                  <div className="bg-gray-200 p-3 rounded-lg mr-16">
                    {isLoading && (
                      <div className="animate-spin relative flex w-5 h-5 ml-2">
                        <Loader />
                      </div>
                    )}
                    {answer || hasError}
                  </div>
                </div>
              )}
            </div>
            <div className="w-full">
              <div className="relative">
                <input
                  placeholder="Ask a question..."
                  name="search"
                  className="block w-full rounded-md py-1.5 pl-4 pr-10 border border-gray-300 col-span-3 p"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6"
                  >
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
