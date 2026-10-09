import { useState } from "react";

import axios from "axios";
import { useRouter } from "next/router";
import styled from "styled-components";

import { useWuphfUser } from "../../hooks/WuphfUserContext";
import Avatar from "../general/Avatar";
import Button from "../general/Button";
/*
What I need in Props:
wuphfID
theme colors
*/
function CommentInput(props) {
  const { addComment, wuphfId } = props;
  const [comment, setComment] = useState("");
  const { wuphfUser } = useWuphfUser();
  const router = useRouter();

  // Fallback to route query parameter 'wid' if props.wuphfId isn't passed directly
  const targetId = wuphfId || router.query.wid || router.query.id;

  function handleChange(event) {
    setComment(event.target.value);
  }

  async function commentRequest() {
    if (!comment.trim()) return;

    try {
      // axios automatically sends cookies on same-origin /api requests
      const res = await axios.post(`/api/wuphfs/${targetId}/comments`, {
        commentBody: comment,
      });

      if (res.data) {
        addComment(res.data);
        setComment("");
      }
    } catch (err) {
      console.error("Error submitting comment:", err);
      alert(err.response?.data?.message || "Failed to submit comment.");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await commentRequest();
  }

  return (
    <InputWrapper onSubmit={handleSubmit}>
      <AvatarWrapper>
        <Avatar
          username={wuphfUser?.userName}
          profileImageUrl={wuphfUser?.avatar?.url}
          size="small"
        />
      </AvatarWrapper>
      <CommentTextArea
        value={comment}
        onChange={handleChange}
        placeholder="What do you want to say?"
        rows="1"
      />
      <Button type="submit" variant="primary">
        Comment!
      </Button>
    </InputWrapper>
  );
}

const InputWrapper = styled.form`
  display: flex;
  align-items: center;
  background-color: pink;
  padding-left: 10px;
  gap: 1rem;
  padding: 1rem;
  color: ${(props) => props.theme.colors.text};
  background-color: ${(props) => props.theme.colors.highlight};
  border: ${({ theme }) => `1.5px solid ${theme.colors.border}`};
  border-top: none;
`;

const AvatarWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
  span {
    width: 50px;
    height: 50px;
  }
`;
const CommentTextArea = styled.textarea`
  font-size: inherit;
  font-family: inherit;
  background-color: ${(props) => props.theme.colors.body};
  color: inherit;
  resize: none;
  display: block;
  outline: none;
  padding: 0.5rem;
  border-radius: 4px;
  width: 100%;
  border: ${(props) =>
    props.error
      ? "1.5px solid red"
      : `1.5px solid ${props.theme.colors.border}`};
  &:focus {
    outline: none;
  }
`;
export default CommentInput;
