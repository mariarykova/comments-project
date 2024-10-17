import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  where,
  Timestamp,
  updateDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import app from "../firebase";

import { formatDate } from "../lib/helpers";

import styles from "./comments.module.css";

const firestore = getFirestore(app);
const auth = getAuth(app);

const Comments = () => {
  const [selectedItem, setSelectedItem] = useState(null);
  const menuItems = ["About", "Projects", "Testimonials", "Contact"];
  const commentsRef = collection(firestore, "comments");
  const commentsQuery = query(commentsRef, orderBy("createdAt"), limit(50));
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [userEmail, setUserEmail] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [activeCommentId, setActiveCommentId] = useState(null);
  const [replyText, setReplyText] = useState("");

  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
        setUserId(user.uid);
      } else {
        window.location.href = "/";
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(firestore, "comments"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  //  useEffect(() => {
  //    const fetchComments = async () => {
  //      try {
  //        if (!userEmail) return;

  //        const commentsRef = collection(firestore, "comments");
  //        const commentsQuery = query(
  //          commentsRef,
  //          where("userEmail", "==", userEmail),
  //          orderBy("createdAt"),
  //          limit(50)
  //        );

  //        const querySnapshot = await getDocs(commentsQuery);
  //        const commentsList = querySnapshot.docs.map((doc) => doc.data());
  //        setComments(commentsList);
  //        setIsLoading(false);
  //      } catch (error) {
  //        console.error("Error fetching comments:", error);
  //        setIsLoading(false);
  //      }
  //    };

  //    fetchComments();
  //  }, [userEmail]);

  const handleCommentClick = (commentId) => {
    setActiveCommentId(commentId);
  };

  const handleKeyDown = (e, comment) => {
    if (e.key === "Enter" && replyText.trim() !== "") {
      onAddReply(comment, replyText);
      setReplyText("");
      setActiveCommentId(null);
    }
  };

  const handleReplyClick = (commentId) => {
    setActiveCommentId(commentId);
  };

  //  console.log("comments", comments);

  const renderComments = (comments, level = 1) => {
    return comments.map((comment, index) => (
      <div key={comment.id}>
        <div className={styles.firstReply}>
          <div className={styles.avatar}>MR</div>
          <div
            className={styles.comment_reply}
            style={{ maxWidth: 662 - level * 100 }}
            onClick={() => handleCommentClick(comment)}
          >
            <div className={styles.reply_header}>
              <div>{comment.userEmail}</div>
              <div>{formatDate(comment.createdAt)}</div>
            </div>
            <p>{comment.text}</p>
            <div className={styles.reply_footer}>
              <div>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15 6H10.791L11.6332 3.47475C11.7847 3.01875 11.7083 2.51325 11.427 2.12325C11.1458 1.73325 10.6898 1.5 10.209 1.5H9C8.77725 1.5 8.5665 1.599 8.42325 1.77L4.89825 6H3C2.17275 6 1.5 6.67275 1.5 7.5V14.25C1.5 15.0773 2.17275 15.75 3 15.75H5.25H12.9802C13.602 15.75 14.166 15.3593 14.385 14.7765L16.4528 9.26325C16.4843 9.17925 16.5 9.09 16.5 9V7.5C16.5 6.67275 15.8273 6 15 6ZM3 7.5H4.5V14.25H3V7.5ZM15 8.86425L12.9802 14.25H6V7.0215L9.351 3H10.2105L9.039 6.51225C8.96175 6.741 9.00075 6.99225 9.14175 7.188C9.28275 7.3845 9.50925 7.5 9.75 7.5H15V8.86425Z"
                    fill="#9397AD"
                  />
                </svg>
                <div>{comment.likes}</div>
              </div>
              <div>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15 1.5H3C2.17275 1.5 1.5 2.17275 1.5 3V16.5L5.49975 13.5H15C15.8273 13.5 16.5 12.8273 16.5 12V3C16.5 2.17275 15.8273 1.5 15 1.5ZM15 12H5.00025L3 13.5V3H15V12Z"
                    fill="#9397AD"
                  />
                </svg>
                <div>3</div>
              </div>
            </div>
          </div>
        </div>

        {/*{console.log("activeCommentId", activeCommentId?.id)}
        {console.log("comment.id", comment?.id)}*/}

        {/*{console.log("level", level)}*/}

        {/* Show input to answer */}
        {activeCommentId?.id === comment.id && (
          <div
            className={styles.firstReply}
            style={{ justifyContent: "flex-end" }}
          >
            <input
              type="text"
              className={styles.add_comment}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              //  onKeyDown={(e) => handleKeyDown(e, comment)}
              onKeyDown={(e) =>
                e.key === "Enter" && handleReplySubmit(e, comment, level)
              }
              placeholder="Add a comment"
              autoFocus
            />
          </div>
        )}
        {/* Render comments second level */}
        {comment.replies && comment.replies.length > 0 && (
          <div>{renderComments(comment.replies, level + 1)}</div>
        )}
      </div>
    ));
  };

  const addComment = async (e) => {
    e.preventDefault();

    if (newComment.trim() === "") return;

    try {
      const specificDate = new Date();
      const docRef = await addDoc(commentsRef, {
        text: newComment,
        parentId: null,
        createdAt: serverTimestamp(),
        userId,
        userEmail,
        likes: 0,
        replies: [],
        level: 1,
      });

      const newCommentData = {
        id: docRef.id,
        text: newComment,
        createdAt: Timestamp.fromDate(specificDate),
        likes: 0,
        replies: [],
        userEmail,
        parentId: null,
        level: 1,
      };

      setComments([...comments, newCommentData]);

      setNewComment("");
    } catch (error) {
      console.error("Error adding comment: ", error);
    }
  };

  const onAddReply = async (parentComment, newReplyText, level) => {
    if (!parentComment || !parentComment.id) {
      console.error("Parent comment is invalid or missing an ID.");
      return;
    }

    if (!newReplyText) {
      console.error("Reply text is empty.");
      return;
    }

    console.log("level", level);

    const specificDate = new Date();
    const newReply = {
      text: newReplyText,
      createdAt: Timestamp.fromDate(specificDate),
      userId,
      userEmail,
      likes: 0,
      replies: level === 2 ? null : [], // replies должен быть массивом для всех уровней
      id: uuidv4(),
      parentId: parentComment.id, // для связи с родительским комментарием
    };

    const updatedComments = [...comments]; // создаем копию комментариев

    // Добавляем комментарий на первый уровень
    if (level === 1) {
      const parentCommentIndex = updatedComments.findIndex(
        (comment) => comment.id === parentComment.id
      );

      if (parentCommentIndex !== -1) {
        const updatedParentComment = { ...updatedComments[parentCommentIndex] };
        if (!updatedParentComment.replies) {
          updatedParentComment.replies = [];
        }
        updatedParentComment.replies.push(newReply);
        updatedComments[parentCommentIndex] = updatedParentComment;

        // Обновляем комментарий первого уровня в Firestore
        const commentRef = doc(firestore, "comments", parentComment.id);
        await updateDoc(commentRef, {
          replies: updatedParentComment.replies,
        });

        setComments(updatedComments); // обновляем состояние комментариев
      }
    }

    // Добавляем комментарий на второй уровень
    else if (level === 2) {
      const parentIndex = updatedComments.findIndex(
        (comment) =>
          comment.replies &&
          comment.replies.some((reply) => reply.id === parentComment.id)
      );

      if (parentIndex !== -1) {
        const updatedParentComment = { ...updatedComments[parentIndex] };
        const replyIndex = updatedParentComment.replies.findIndex(
          (reply) => reply.id === parentComment.id
        );

        if (replyIndex !== -1) {
          if (!updatedParentComment.replies[replyIndex].replies) {
            updatedParentComment.replies[replyIndex].replies = [];
          }
          updatedParentComment.replies[replyIndex].replies.push(newReply);
          updatedComments[parentIndex] = updatedParentComment;

          // Обновляем комментарий второго уровня в Firestore
          const commentRef = doc(
            firestore,
            "comments",
            updatedParentComment.id
          );
          await updateDoc(commentRef, {
            replies: updatedParentComment.replies,
          });

          setComments(updatedComments); // обновляем состояние комментариев
        }
      } else {
        console.error("Parent comment not found for second level.");
        return;
      }
    }

    // Добавляем комментарий на третий уровень
    else if (level === 3) {
      updatedComments.forEach((firstLevelComment) => {
        const secondLevelReplyIndex = firstLevelComment.replies.findIndex(
          (reply) => reply.id === parentComment.id
        );

        if (secondLevelReplyIndex !== -1) {
          if (!firstLevelComment.replies[secondLevelReplyIndex].replies) {
            firstLevelComment.replies[secondLevelReplyIndex].replies = [];
          }
          firstLevelComment.replies[secondLevelReplyIndex].replies.push(
            newReply
          );

          // Обновляем комментарий второго уровня в Firestore
          const commentRef = doc(firestore, "comments", firstLevelComment.id);
          updateDoc(commentRef, {
            replies: firstLevelComment.replies,
          });
        }
      });

      setComments(updatedComments); // обновляем состояние комментариев
    }

    try {
      // Лог для отладки
      console.log("Comments successfully updated in Firestore");
    } catch (error) {
      console.error("Error updating document:", error);
    }
  };

  //  const onAddReply = async (parentComment, newReplyText, level) => {
  //    if (!parentComment || !parentComment.id) {
  //      console.error("Parent comment is invalid or missing an ID.");
  //      return;
  //    }

  //    if (!newReplyText) {
  //      console.error("Reply text is empty.");
  //      return;
  //    }

  //    const specificDate = new Date();
  //    const newReply = {
  //      text: newReplyText,
  //      createdAt: Timestamp.fromDate(specificDate),
  //      userId,
  //      userEmail,
  //      likes: 0,
  //      replies: [], // replies будет массивом для всех уровней
  //      id: uuidv4(),
  //      parentId: parentComment.id,
  //    };

  //    const updatedComments = [...comments];

  //    console.log("updatedComments", updatedComments);

  //    // Поиск родительского комментария на первом уровне
  //    const parentCommentIndex = updatedComments.findIndex(
  //      (comment) => comment.id === parentComment.id
  //    );

  //    if (level === 1 && parentCommentIndex !== -1) {
  //      // Добавляем ответ в комментарий первого уровня
  //      const updatedParentComment = { ...updatedComments[parentCommentIndex] };
  //      if (!updatedParentComment.replies) {
  //        updatedParentComment.replies = [];
  //      }
  //      updatedParentComment.replies.push(newReply);
  //      updatedComments[parentCommentIndex] = updatedParentComment;
  //    } else if (level === 2) {
  //      // Ищем родительский комментарий второго уровня в replies первого уровня
  //      const parentIndex = updatedComments.findIndex(
  //        (comment) =>
  //          comment.replies &&
  //          comment.replies.some((reply) => reply.id === parentComment.id)
  //      );

  //      if (parentIndex !== -1) {
  //        const updatedParentComment = { ...updatedComments[parentIndex] };
  //        const replyIndex = updatedParentComment.replies.findIndex(
  //          (reply) => reply.id === parentComment.id
  //        );

  //        if (replyIndex !== -1) {
  //          if (!updatedParentComment.replies[replyIndex].replies) {
  //            updatedParentComment.replies[replyIndex].replies = [];
  //          }
  //          updatedParentComment.replies[replyIndex].replies.push(newReply);
  //          updatedComments[parentIndex] = updatedParentComment;
  //        }
  //      } else {
  //        console.error("Parent comment not found for second level.");
  //        return;
  //      }
  //    } else if (level === 3) {
  //      // Для третьего уровня — добавляем ответ в replies второго уровня
  //      updatedComments.forEach((firstLevelComment) => {
  //        const secondLevelReplyIndex = firstLevelComment.replies.findIndex(
  //          (reply) => reply.id === parentComment.id
  //        );
  //        if (secondLevelReplyIndex !== -1) {
  //          if (!firstLevelComment.replies[secondLevelReplyIndex].replies) {
  //            firstLevelComment.replies[secondLevelReplyIndex].replies = [];
  //          }
  //          firstLevelComment.replies[secondLevelReplyIndex].replies.push(
  //            newReply
  //          );
  //        }
  //      });
  //    }

  //    try {
  //      // Обновляем родительский комментарий в Firestore
  //      const commentRef = doc(firestore, "comments", parentComment.id);
  //      await updateDoc(commentRef, {
  //        replies: updatedComments[parentCommentIndex]?.replies || [],
  //      });

  //      setComments(updatedComments); // Обновляем состояние
  //    } catch (error) {
  //      console.error("Error updating document: ", error);
  //    }
  //  };

  //  const onAddReply = async (parentComment, newReplyText, level) => {
  //    if (!parentComment || !parentComment.id) {
  //      console.error("Parent comment is invalid or missing an ID.");
  //      return;
  //    }

  //    console.log("parentComment", parentComment);

  //    if (!newReplyText) {
  //      console.error("Reply text is empty.");
  //      return;
  //    }

  //    const specificDate = new Date();
  //    const newReply = {
  //      text: newReplyText,
  //      createdAt: Timestamp.fromDate(specificDate),
  //      userId,
  //      userEmail,
  //      likes: 0,
  //      replies: [], // replies будет массивом для всех уровней
  //      id: uuidv4(),
  //    };

  //    const updatedComments = [...comments];
  //    console.log("updatedComments", updatedComments);
  //    // Поиск индекса родительского комментария на первом уровне
  //    const parentCommentIndex = updatedComments.findIndex(
  //      (comment) => comment.id === parentComment.id
  //    );

  //    if (parentCommentIndex === -1) {
  //      console.error("Parent comment not found.");
  //      return; // Прекращаем выполнение, если комментарий не найден
  //    }

  //    // Инициализируем replies, если их нет
  //    const updatedParentComment = { ...updatedComments[parentCommentIndex] };
  //    if (!updatedParentComment.replies) {
  //      updatedParentComment.replies = [];
  //    }

  //    if (level === 1) {
  //      // Добавляем ответ в комментарий первого уровня
  //      updatedParentComment.replies.push(newReply);
  //      updatedComments[parentCommentIndex] = updatedParentComment;
  //    } else if (level === 2) {
  //      // Находим родительский комментарий второго уровня
  //      const replyIndex = updatedParentComment.replies.findIndex(
  //        (reply) => reply.id === parentComment.id
  //      );

  //      if (replyIndex !== -1) {
  //        // Инициализируем replies второго уровня, если их нет
  //        if (!updatedParentComment.replies[replyIndex].replies) {
  //          updatedParentComment.replies[replyIndex].replies = [];
  //        }
  //        updatedParentComment.replies[replyIndex].replies.push(newReply);
  //      } else {
  //        // Если это ответ на второй уровень, добавляем его в replies первого уровня
  //        updatedParentComment.replies.push(newReply);
  //      }
  //      updatedComments[parentCommentIndex] = updatedParentComment;
  //    } else if (level === 3) {
  //      // Для третьего уровня — добавляем ответ в replies второго уровня
  //      updatedComments.forEach((firstLevelComment) => {
  //        const secondLevelReplyIndex = firstLevelComment.replies.findIndex(
  //          (reply) => reply.id === parentComment.id
  //        );
  //        if (secondLevelReplyIndex !== -1) {
  //          if (!firstLevelComment.replies[secondLevelReplyIndex].replies) {
  //            firstLevelComment.replies[secondLevelReplyIndex].replies = [];
  //          }
  //          firstLevelComment.replies[secondLevelReplyIndex].replies.push(
  //            newReply
  //          );
  //        }
  //      });
  //    }

  //    try {
  //      // Обновляем родительский комментарий в Firestore
  //      const commentRef = doc(firestore, "comments", parentComment.id);
  //      await updateDoc(commentRef, {
  //        replies: updatedParentComment.replies,
  //      });

  //      setComments(updatedComments); // Обновляем состояние
  //    } catch (error) {
  //      console.error("Error updating document: ", error);
  //    }
  //  };

  //  const onAddReply = async (parentComment, newReplyText, level) => {
  //    if (!parentComment || !parentComment.id) {
  //      console.error("Parent comment is invalid or missing an ID.");
  //      return;
  //    }

  //    if (!newReplyText) {
  //      console.error("Reply text is empty.");
  //      return;
  //    }

  //    const specificDate = new Date();
  //    const newReply = {
  //      text: newReplyText,
  //      createdAt: Timestamp.fromDate(specificDate),
  //      userId,
  //      userEmail,
  //      likes: 0,
  //      replies: [], // replies массив для всех уровней
  //      id: uuidv4(),
  //    };

  //    const updatedComments = [...comments];

  //    // Поиск индекса родительского комментария на первом уровне
  //    const parentCommentIndex = updatedComments.findIndex(
  //      (comment) => comment.id === parentComment.id
  //    );

  //    if (level === 1 && parentCommentIndex !== -1) {
  //      // Добавляем ответ в комментарий первого уровня
  //      const updatedParentComment = { ...updatedComments[parentCommentIndex] };
  //      if (!updatedParentComment.replies) {
  //        updatedParentComment.replies = []; // Инициализируем replies, если их нет
  //      }
  //      updatedParentComment.replies.push(newReply);
  //      updatedComments[parentCommentIndex] = updatedParentComment;
  //    } else if (level === 2) {
  //      // Ищем родительский комментарий второго уровня
  //      const parentIndex = updatedComments.findIndex(
  //        (comment) => comment.id === parentComment.id
  //      );

  //      if (parentIndex !== -1) {
  //        const updatedParentComment = { ...updatedComments[parentIndex] };
  //        const replyIndex = updatedParentComment.replies.findIndex(
  //          (reply) => reply.id === parentComment.id
  //        );

  //        if (replyIndex !== -1) {
  //          if (!updatedParentComment.replies[replyIndex].replies) {
  //            updatedParentComment.replies[replyIndex].replies = []; // Инициализируем replies
  //          }
  //          updatedParentComment.replies[replyIndex].replies.push(newReply);
  //          updatedComments[parentIndex] = updatedParentComment;
  //        }
  //      }
  //    } else if (level === 3) {
  //      // Для третьего уровня — добавляем ответ в replies второго уровня
  //      updatedComments.forEach((firstLevelComment) => {
  //        const secondLevelReplyIndex = firstLevelComment.replies.findIndex(
  //          (reply) => reply.id === parentComment.id
  //        );
  //        if (secondLevelReplyIndex !== -1) {
  //          if (!firstLevelComment.replies[secondLevelReplyIndex].replies) {
  //            firstLevelComment.replies[secondLevelReplyIndex].replies = []; // Инициализируем replies
  //          }
  //          firstLevelComment.replies[secondLevelReplyIndex].replies.push(
  //            newReply
  //          );
  //        }
  //      });
  //    }

  //    try {
  //      // Обновляем родительский комментарий в Firestore
  //      const commentRef = doc(firestore, "comments", parentComment.id);
  //      await updateDoc(commentRef, {
  //        replies: updatedComments[parentCommentIndex].replies,
  //      });

  //      setComments(updatedComments); // Обновляем состояние
  //    } catch (error) {
  //      console.error("Error updating document: ", error);
  //    }
  //  };

  const onAddReplyOnlySecondLevel = async (
    parentComment,
    newReplyText,
    level
  ) => {
    if (!parentComment || !parentComment.id) {
      console.error("Parent comment is invalid or missing an ID.");
      return;
    }

    if (!newReplyText) {
      console.error("Reply text is empty.");
      return;
    }

    const specificDate = new Date();
    const newReply = {
      text: newReplyText,
      createdAt: Timestamp.fromDate(specificDate),
      userId,
      userEmail,
      likes: 0,
      replies: [],
      id: uuidv4(),
    };

    const updatedComments = [...comments];
    console.log("updatedComments", updatedComments);
    const parentCommentIndex = updatedComments.findIndex(
      (comment) => comment.id === parentComment.id
    );

    console.log("parentCommentIndex", parentCommentIndex);

    if (parentCommentIndex !== -1) {
      const updatedParentComment = { ...updatedComments[parentCommentIndex] };

      // Проверяем и инициализируем массив replies, если его нет
      if (!updatedParentComment.replies) {
        updatedParentComment.replies = [];
      }

      if (level === 1) {
        // Добавляем ответ в комментарий первого уровня
        updatedParentComment.replies.push(newReply);
      } else if (level === 2) {
        // Добавляем ответ в комментарий второго уровня
        const replyIndex = updatedParentComment.replies.findIndex(
          (reply) => reply.id === parentComment.id
        );

        if (replyIndex !== -1) {
          // Убедимся, что replies второго уровня — это массив
          if (!updatedParentComment.replies[replyIndex].replies) {
            updatedParentComment.replies[replyIndex].replies = [];
          }
          updatedParentComment.replies[replyIndex].replies.push(newReply);
        } else {
          // Добавляем новый ответ на втором уровне
          updatedParentComment.replies.push(newReply);
        }
      } else {
        // Если это третий уровень, добавляем ответ в replies третьего уровня (к этому же уровню)
        updatedParentComment.replies.push(newReply);
      }

      try {
        // Обновляем родительский комментарий в Firestore
        const commentRef = doc(firestore, "comments", parentComment.id);
        await updateDoc(commentRef, {
          replies: updatedParentComment.replies, // Обновляем массив replies
        });

        updatedComments[parentCommentIndex] = updatedParentComment;
        setComments(updatedComments); // Обновляем состояние
      } catch (error) {
        console.error("Error updating document: ", error);
      }
    }
  };

  const handleReplySubmit = (e, comment, level) => {
    console.log(e, comment, level);
    e.preventDefault();
    if (replyText.trim() === "") return;

    onAddReply(comment, replyText, level);
    setReplyText("");
    setActiveCommentId(null);
  };

  console.log("comments", comments);

  return (
    <div className={styles.comments}>
      <header className={styles.comments_header}>
        <ul className={styles.comments_header_menu}>
          {menuItems.map((item, index) => (
            <li
              key={index}
              className={`${styles.menu_item} ${
                selectedItem === index ? styles.selected : ""
              }`}
              onClick={() => setSelectedItem(index)}
            >
              {item}
              <svg
                className={styles.dot}
                width="7"
                height="7"
                viewBox="0 0 7 7"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="3.5" cy="3.5" r="3.5" fill="white" />
              </svg>
            </li>
          ))}
        </ul>
      </header>
      <div className={styles.comments_img}>
        <img src="/images/img_comments.png" />
      </div>
      <div className={styles.comments_title_section}>
        <div className={styles.comments_title}>
          A small selection of <div>recent projects</div>
        </div>
        <p className={styles.comments_description}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
          ligula quis lacus fermentum, vitae vulputate sem tristique. Nunc justo
          orci, porta in luctus eget, ultrices vitae justo. Mauris dignissim
          laoreet mi, a commodo libero volutpat non. Maecenas aliquam sed leo eu
          blandit. Nam vehicula rhoncus libero ut porttitor. Proin urna tortor,
          bibendum at faucibus auctor, cursus sit amet odio. In hac habitasse
          platea dictumst. Proin ac tortor vel tortor auctor pellentesque eget
          nec nisl. Phasellus pulvinar varius tortor sed sagittis. Etiam aliquam
          consectetur purus fringilla varius. Maecenas nec dolor dolor. Cras
          faucibus malesuada luctus. Nam auctor vel tortor eget congue. Fusce
          porta imperdiet ante scelerisque ullamcorper. Pellentesque luctus
          ullamcorper lectus faucibus fringilla. Aenean tristique efficitur
          iaculis. Aliquam eu egestas mi, quis tristique justo. Donec eu ante at
          tellus eleifend pellentesque. Curabitur fermentum lectus eu erat
          porta, id sagittis sem aliquet. Integer aliquet vehicula lectus, nec
          finibus nibh tincidunt eu. Vestibulum quis dui nisi. In a pharetra
          enim, id blandit quam. Sed lobortis ligula enim, egestas aliquam purus
          facilisis et. Phasellus vitae leo a ligula commodo ultrices sed non
          elit.
        </p>
      </div>
      <div className={styles.comments_container}>
        <div className={`${styles.comments_list}`}>
          <form onSubmit={addComment} className={styles.comment_input_wrapper}>
            <input
              className={styles.comment_input}
              placeholder="Add comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button className={styles.comment_btn}>Post</button>
          </form>
          {isLoading ? (
            <div className={styles.loading}>Comments are loading...</div>
          ) : (
            <div className={styles.comments_wrapper}>
              {renderComments(comments)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comments;
