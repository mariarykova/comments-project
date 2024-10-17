import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  addDoc,
  serverTimestamp,
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
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [userEmail, setUserEmail] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [replyText, setReplyText] = useState("");

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

  const handleCommentClick = (commentId) => {
    setActiveCommentId(commentId);
  };

  const countReplies = (comment) => {
    if (!comment.replies) return 0;

    let count = comment.replies.length;
    comment.replies.forEach((reply) => {
      if (reply.replies && reply.replies.length > 0) {
        count += reply.replies.length;
      }
    });
    return count;
  };

  const renderComments = (comments, level = 1) => {
    return comments.map((comment, index) => (
      <div key={comment.id}>
        <div className={styles.firstReply}>
          <div className={styles.avatar}>
            {userEmail.charAt(0).toUpperCase()}
          </div>
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
              <div
                className={styles.like}
                onClick={(e) => handleLike(e, comment, level)}
              >
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
              {level < 3 ? (
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
                  <div>{countReplies(comment)}</div>
                </div>
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>

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
              onKeyDown={(e) =>
                e.key === "Enter" && handleReplySubmit(e, comment, level)
              }
              placeholder="Add a comment"
              autoFocus
            />
          </div>
        )}
        {comment.replies && comment.replies.length > 0 && (
          <div>{renderComments(comment.replies, level + 1)}</div>
        )}
      </div>
    ));
  };

  const handleLike = async (e, comment, level) => {
    e.preventDefault();

    try {
      const userId = auth.currentUser.uid;
      let updatedLikes;
      let updatedLikedBy;

      if (comment.likedBy && comment.likedBy.includes(userId)) {
        updatedLikes = comment.likes - 1;
        updatedLikedBy = comment.likedBy.filter((id) => id !== userId);
      } else {
        updatedLikes = comment.likes + 1;
        updatedLikedBy = comment.likedBy
          ? [...comment.likedBy, userId]
          : [userId];
      }

      const updatedComments = [...comments];

      if (level === 1) {
        const parentCommentIndex = updatedComments.findIndex(
          (c) => c.id === comment.id
        );
        if (parentCommentIndex !== -1) {
          updatedComments[parentCommentIndex].likes = updatedLikes;
          updatedComments[parentCommentIndex].likedBy = updatedLikedBy;

          const commentRef = doc(firestore, "comments", comment.id);
          await updateDoc(commentRef, {
            likes: updatedLikes,
            likedBy: updatedLikedBy,
          });
        }
      } else if (level === 2) {
        updatedComments.forEach((firstLevelComment) => {
          const replyIndex = firstLevelComment.replies.findIndex(
            (reply) => reply.id === comment.id
          );
          if (replyIndex !== -1) {
            firstLevelComment.replies[replyIndex].likes = updatedLikes;
            firstLevelComment.replies[replyIndex].likedBy = updatedLikedBy;

            const commentRef = doc(firestore, "comments", firstLevelComment.id);
            updateDoc(commentRef, {
              replies: firstLevelComment.replies,
            });
          }
        });
      } else if (level === 3) {
        updatedComments.forEach((firstLevelComment) => {
          firstLevelComment.replies.forEach((secondLevelReply) => {
            const thirdLevelReplyIndex = secondLevelReply.replies.findIndex(
              (reply) => reply.id === comment.id
            );
            if (thirdLevelReplyIndex !== -1) {
              secondLevelReply.replies[thirdLevelReplyIndex].likes =
                updatedLikes;
              secondLevelReply.replies[thirdLevelReplyIndex].likedBy =
                updatedLikedBy;

              const commentRef = doc(
                firestore,
                "comments",
                firstLevelComment.id
              );
              updateDoc(commentRef, {
                replies: firstLevelComment.replies,
              });
            }
          });
        });
      }

      setComments(updatedComments);
    } catch (error) {
      console.error("Error updating likes:", error);
    }
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
    if (!parentComment || !parentComment.id) return;

    if (!newReplyText) return;

    const specificDate = new Date();
    const newReply = {
      text: newReplyText,
      createdAt: Timestamp.fromDate(specificDate),
      userId,
      userEmail,
      likes: 0,
      replies: level === 2 ? null : [],
      id: uuidv4(),
      parentId: parentComment.id,
    };

    const updatedComments = [...comments];

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

        const commentRef = doc(firestore, "comments", parentComment.id);
        await updateDoc(commentRef, {
          replies: updatedParentComment.replies,
        });

        setComments(updatedComments);
      }
    } else if (level === 2) {
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

          const commentRef = doc(
            firestore,
            "comments",
            updatedParentComment.id
          );
          await updateDoc(commentRef, {
            replies: updatedParentComment.replies,
          });

          setComments(updatedComments);
        }
      } else {
        console.error("Parent comment not found for second level.");
        return;
      }
    } else if (level === 3) {
      updatedComments.forEach((firstLevelComment) => {
        const secondLevelReplyIndex = firstLevelComment.replies.findIndex(
          (comment) =>
            comment.replies &&
            comment.replies.some((reply) => reply.id === parentComment.id)
        );

        if (secondLevelReplyIndex !== -1) {
          if (!firstLevelComment.replies[secondLevelReplyIndex].replies) {
            firstLevelComment.replies[secondLevelReplyIndex].replies = [];
          }
          firstLevelComment.replies[secondLevelReplyIndex].replies.push(
            newReply
          );

          const commentRef = doc(firestore, "comments", firstLevelComment.id);
          updateDoc(commentRef, {
            replies: firstLevelComment.replies,
          });
        }
      });

      setComments(updatedComments);
    }
  };

  const handleReplySubmit = (e, comment, level) => {
    e.preventDefault();
    if (replyText.trim() === "") return;

    onAddReply(comment, replyText, level);
    setReplyText("");
    setActiveCommentId(null);
  };

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
