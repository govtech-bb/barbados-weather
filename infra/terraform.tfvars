# Live govtech-sandbox deployment values.
# The CloudFront-VPCOrigins-Service-SG now exists in this account (created when
# the VPC origin was first applied), so the ALB's locked-down ingress from it is
# enabled. The variable default stays false so a brand-new account can still do
# the two-phase first apply; this file pins the steady state for THIS account.
enable_cloudfront_origin_ingress = true
