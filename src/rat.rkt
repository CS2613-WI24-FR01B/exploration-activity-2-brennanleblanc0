#lang racket

(require racket/system)

(require crypto)
(require crypto/libcrypto)

(define (init)
  (system "mkdir ./.rat")
  (system "touch ./.rat/commit_list.rat"))