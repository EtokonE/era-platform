import {
  Box,
  SimpleGrid,
  Skeleton,
  SkeletonCircle,
  Stack,
} from "@chakra-ui/react"

const PendingPlayers = () => (
  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
    {Array.from({ length: 6 }).map((_, index) => (
      <Box
        key={index}
        borderRadius="xl"
        borderWidth="1px"
        borderColor="border"
        bg="bg.surface"
        p={6}
      >
        <Stack align="center" gap={4}>
          <SkeletonCircle size="24" />
          <Skeleton height="20px" width="60%" />
          <Skeleton height="18px" width="40%" />
          <Skeleton height="18px" width="80%" />
          <Skeleton height="18px" width="70%" />
        </Stack>
      </Box>
    ))}
  </SimpleGrid>
)

export default PendingPlayers
