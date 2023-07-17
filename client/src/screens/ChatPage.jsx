import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io.connect("https://node-react-chat.vercel.app/");

const ChatPage = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [textFormatting, setTextFormatting] = useState([]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  const handleMessageSend = () => {
    const formattedMessage = applyTextFormatting(message); // Apply formatting to the message
    socket.emit("send_private_message", {
      message: formattedMessage,
      to: selectedUser.id,
      formatting: textFormatting, // Pass the selected text formatting options
    });
    addMessageToChat({
      message: formattedMessage,
      from: "me",
      formatting: textFormatting,
    }); // Include text formatting options
    setMessage("");
    setTextFormatting([]);
  };

  const addMessageToChat = (message) => {
    setChatMessages((prevMessages) => [...prevMessages, message]);
  };

  const applyTextFormatting = (text) => {
    let formattedText = text;

    // Apply text formatting based on the selected options
    textFormatting.forEach((formattingOption) => {
      switch (formattingOption) {
        case "bold":
          formattedText = `<strong>${formattedText}</strong>`;
          break;
        case "italic":
          formattedText = `<em>${formattedText}</em>`;
          break;
        case "strikethrough":
          formattedText = `<del>${formattedText}</del>`;
          break;
        case "hyperlink":
          formattedText = `<a href="URL" style="text-decoration: underline; color: blue;">${formattedText}</a>`;
          break;
        case "bulletedlist":
          formattedText = `<ul><li>${formattedText}</li></ul>`;
          break;
        case "numberedlist":
          formattedText = `<ol><li>${formattedText.replace(
            /\n/g,
            "</li><li>"
          )}</li></ol>`;
          break;
        case "blockquote":
          formattedText = `<blockquote>${formattedText}</blockquote>`;
          break;
        case "codesnippet":
          formattedText = `<code>${formattedText}</code>`;
          break;
        case "codeblock":
          formattedText = `<pre><code>${formattedText}</code></pre>`;
          break;
        default:
          break;
      }
    });

    return formattedText;
  };

  const handleOptionSelect = (option) => {
    setTextFormatting((prevOptions) => [...prevOptions, option]);
  };

  const handleOptionDeselect = (option) => {
    setTextFormatting((prevOptions) => prevOptions.filter((o) => o !== option));
  };

  const handleLogin = () => {
    socket.emit("join", { name, phoneNumber });
    setIsLoggedIn(true);
  };

  useEffect(() => {
    socket.on("user_join", (user) => {
      setOnlineUsers((prevUsers) => [...prevUsers, user]);
    });

    socket.on("user_leave", (userId) => {
      setOnlineUsers((prevUsers) =>
        prevUsers.filter((user) => user.id !== userId)
      );
    });

    socket.on("receive_private_message", ({ message, from }) => {
      addMessageToChat({ message, from });
    });

    return () => {
      socket.off("user_join");
      socket.off("user_leave");
      socket.off("receive_private_message");
    };
  }, []);

  useEffect(() => {
    socket.emit("get_online_users"); // Request online users list when logged in
    socket.on("online_users_list", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("online_users_list");
    };
  }, [isLoggedIn]);

  return (
    <div className="flex h-screen">
      {/* Left sidebar */}
      <div className="w-1/4 bg-gray-100">
        <div className="p-4">
          <h2 className="text-2xl font-semibold mb-4">Users</h2>
          <ul>
            {onlineUsers.map((user) => (
              <li
                key={user.id}
                className={`p-2 cursor-pointer ${
                  selectedUser && selectedUser.id === user.id
                    ? "bg-blue-500 text-white"
                    : ""
                }`}
                onClick={() => handleUserSelect(user)}
              >
                {user.name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right chat section */}
      <div className="flex-1 bg-white flex flex-col">
        {!isLoggedIn ? (
          <div className="p-4 flex-1 flex items-center justify-center">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-semibold mb-4">Login</h2>
              <input
                type="text"
                className="w-full border border-gray-300 rounded py-2 px-4 mb-4"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <input
                type="text"
                className="w-full border border-gray-300 rounded py-2 px-4 mb-4"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button
                className="bg-blue-500 text-white rounded px-4 py-2"
                onClick={handleLogin}
              >
                Login
              </button>
            </div>
          </div>
        ) : selectedUser ? (
          <div className="p-4 flex-1">
            <h2 className="text-2xl font-semibold mb-4">
              Chat with {selectedUser.name}
            </h2>
            {/* Display chat messages here */}
            {chatMessages.map((chatMessage, index) => (
              <div
                key={index}
                className={
                  chatMessage.from === "me" ? "text-right" : "text-left"
                }
              >
                <p>
                  {chatMessage.from === "me" ? (
                    chatMessage.formatting.length > 0 ? (
                      <span
                        dangerouslySetInnerHTML={{
                          __html: applyTextFormatting(chatMessage.message),
                        }}
                      ></span>
                    ) : (
                      chatMessage.message
                    )
                  ) : (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: applyTextFormatting(chatMessage.message),
                      }}
                    ></span>
                  )}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a user to start a chat</p>
          </div>
        )}

        {/* List of online users */}
        {isLoggedIn && (
          <div className="p-4">
            <h2 className="text-2xl font-semibold mb-4">Online Users</h2>
            <ul>
              {onlineUsers.map((user) => (
                <li key={user.id}>{user.name}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Input box and send button */}
        {isLoggedIn && (
          <div className="p-4">
            <div className="">
              <div className="flex">
                <button
                  className={`${
                    textFormatting.includes("bold")
                      ? "bg-blue-500 text-white"
                      : ""
                  } px-2 py-1 mr-1 rounded`}
                  onClick={() =>
                    textFormatting.includes("bold")
                      ? handleOptionDeselect("bold")
                      : handleOptionSelect("bold")
                  }
                >
                  B
                </button>
                <button
                  className={`${
                    textFormatting.includes("italic")
                      ? "bg-blue-500 text-white"
                      : ""
                  } px-2 py-1 mr-1 rounded`}
                  onClick={() =>
                    textFormatting.includes("italic")
                      ? handleOptionDeselect("italic")
                      : handleOptionSelect("italic")
                  }
                >
                  I
                </button>
                <button
                  className={`${
                    textFormatting.includes("strikethrough")
                      ? "bg-blue-500 text-white"
                      : ""
                  } px-2 py-1 mr-1 rounded`}
                  onClick={() =>
                    textFormatting.includes("strikethrough")
                      ? handleOptionDeselect("strikethrough")
                      : handleOptionSelect("strikethrough")
                  }
                >
                  S
                </button>
                <button
                  className={`${
                    textFormatting.includes("hyperlink")
                      ? "bg-blue-500 text-white"
                      : ""
                  } px-2 py-1 mr-1 rounded`}
                  onClick={() =>
                    textFormatting.includes("hyperlink")
                      ? handleOptionDeselect("hyperlink")
                      : handleOptionSelect("hyperlink")
                  }
                >
                  Link
                </button>
                <button
                  className={`${
                    textFormatting.includes("bulletedlist")
                      ? "bg-blue-500 text-white"
                      : ""
                  } px-2 py-1 mr-1 rounded`}
                  onClick={() =>
                    textFormatting.includes("bulletedlist")
                      ? handleOptionDeselect("bulletedlist")
                      : handleOptionSelect("bulletedlist")
                  }
                >
                  Bullets
                </button>
                <button
                  className={`${
                    textFormatting.includes("numberedlist")
                      ? "bg-blue-500 text-white"
                      : ""
                  } px-2 py-1 mr-1 rounded`}
                  onClick={() =>
                    textFormatting.includes("numberedlist")
                      ? handleOptionDeselect("numberedlist")
                      : handleOptionSelect("numberedlist")
                  }
                >
                  Numbers
                </button>
                <button
                  className={`${
                    textFormatting.includes("blockquote")
                      ? "bg-blue-500 text-white"
                      : ""
                  } px-2 py-1 mr-1 rounded`}
                  onClick={() =>
                    textFormatting.includes("blockquote")
                      ? handleOptionDeselect("blockquote")
                      : handleOptionSelect("blockquote")
                  }
                >
                  Quote
                </button>
                <button
                  className={`${
                    textFormatting.includes("codesnippet")
                      ? "bg-blue-500 text-white"
                      : ""
                  } px-2 py-1 mr-1 rounded`}
                  onClick={() =>
                    textFormatting.includes("codesnippet")
                      ? handleOptionDeselect("codesnippet")
                      : handleOptionSelect("codesnippet")
                  }
                >
                  Code
                </button>
                <button
                  className={`${
                    textFormatting.includes("codeblock")
                      ? "bg-blue-500 text-white"
                      : ""
                  } px-2 py-1 mr-1 rounded`}
                  onClick={() =>
                    textFormatting.includes("codeblock")
                      ? handleOptionDeselect("codeblock")
                      : handleOptionSelect("codeblock")
                  }
                >
                  Code Block
                </button>
              </div>
              <div className="flex">
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-l py-2 px-4"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button
                  className="bg-blue-500 text-white rounded-r px-4 py-2"
                  onClick={handleMessageSend}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
