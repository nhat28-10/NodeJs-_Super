import { useEffect, useState, useRef } from "react";
import socket from "./socket";
import axios from "axios";
import InfiniteScroll from "react-infinite-scroll-component";
const LIMIT = 10;
const PAGE = 1;
export default function Chat() {
  const [value, setValue] = useState("");
  const [conversations, setConversations] = useState([]);
  const [pagination, setPagination] = useState({
    page: PAGE,
    total_page: 0,
  });
  const chatRef = useRef(null);
  const profile = JSON.parse(localStorage.getItem("profile"));
  const [receiver, setReceiver] = useState("");

  // Hardcode username -> userId
  const users = {
    nhat1: "69a5247222f340317726860b",
    nhatnguyen281003: "69afada8f1ea8101a18fa5a1",
  };

  const usernames = Object.keys(users);

  const getProfile = (username) => {
    const userId = users[username];

    if (userId === profile._id) {
      alert("You cannot chat with yourself");
      return;
    }

    setReceiver(userId);
    alert(`Now you can chat with ${username}`);
  };
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [conversations]);
  useEffect(() => {
    socket.auth = {
      _id: profile._id,
    };

    socket.connect();

    socket.off("receive private message");

    socket.on("receive_message", (data) => {
      const { payload } = data;

      setConversations((prev) => [...prev, payload]);
    });

    return () => {
      socket.off("receive private message");
    };
  }, []);
  useEffect(() => {
    if (receiver) {
      axios
        .get(`/conversations/receivers/${receiver}`, {
          baseURL: import.meta.env.VITE_API_URL,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          params: {
            limit: LIMIT,
            page: PAGE,
          },
        })
        .then((res) => {
          const { conversations, page, total_page } = res.data.result;
          console.log(
            "API conversations raw:",
            conversations.map((c) => ({
              content: c.content,
              created_at: c.created_at,
            })),
          );

          setConversations(conversations);
          setPagination({
            page,
            total_page,
          });
        });
    }
  }, [receiver]);
  const fetchMoreConversations = () => {
    if (receiver && pagination.page < pagination.total_page) {
      axios
        .get(`/conversations/receivers/${receiver}`, {
          baseURL: import.meta.env.VITE_API_URL,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          params: {
            limit: LIMIT,
            page: pagination.page + 1,
          },
        })
        .then((res) => {
          const { conversations, page, total_page } = res.data.result;
          setConversations((prev) => [...conversations, ...prev]);
          setPagination({
            page,
            total_page,
          });
        });
    }
  };
  const send = (e) => {
    e.preventDefault();

    if (!receiver) {
      alert("Please choose a user first");
      return;
    }
    const conversation = {
      content: value,
      sender_id: profile._id,
      receiver_id: receiver,
    };
    socket.emit("send_message", {
      payload: conversation,
    });

    setConversations((prev) => [
      ...prev,
      {
        ...conversation,
        _id: new Date().getTime(),
      },
    ]);

    setValue("");
  };

  return (
    <div>
      <h1>Chat</h1>

      <div>
        {usernames.map((username) => (
          <div key={username}>
            <button onClick={() => getProfile(username)}>{username}</button>
          </div>
        ))}
      </div>

      <div
        ref={chatRef}
        id="scrollableDiv"
        style={{
          height: 300,
          overflow: "auto",
          display: "flex",
          flexDirection: "column-reverse",
        }}
      >
        <InfiniteScroll
          dataLength={conversations.length}
          next={fetchMoreConversations}
          hasMore={pagination.page < pagination.total_page}
          loader={<h4>Loading...</h4>}
          scrollableTarget="scrollableDiv"
          style={{ display: "flex", flexDirection: "column-reverse" }}
        >
          {conversations.map((conversation) => (
            <div key={conversation._id}>
              <div className="message-container">
                <div
                  className={
                    "message " +
                    (conversation.sender_id === profile._id
                      ? "message-right"
                      : "")
                  }
                >
                  {conversation.content}
                </div>
              </div>
            </div>
          ))}
        </InfiniteScroll>
      </div>

      <form onSubmit={send}>
        <input
          type="text"
          onChange={(e) => setValue(e.target.value)}
          value={value}
        />
        <button type="Submit">Send</button>
      </form>
    </div>
  );
}
