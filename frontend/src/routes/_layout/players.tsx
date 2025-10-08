import {
  Container,
  EmptyState,
  Flex,
  Heading,
  SimpleGrid,
  VStack,
} from "@chakra-ui/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useMemo } from "react"
import { FiUsers } from "react-icons/fi"

import { PlayersService, type UserPublic } from "@/client"
import {
  type Division,
  type DivisionGroup,
  DivisionGroupsService,
  DivisionsService,
} from "@/client/players-extra"
import PendingPlayers from "@/components/Pending/PendingPlayers"
import AddPlayer from "@/components/Players/AddPlayer"
import PlayerCard from "@/components/Players/PlayerCard"

const playersQueryOptions = {
  queryKey: ["players"],
  queryFn: () => PlayersService.listPlayers(),
}

const divisionsQueryOptions = {
  queryKey: ["divisions"],
  queryFn: () => DivisionsService.listDivisions(),
}

const divisionGroupsQueryOptions = {
  queryKey: ["division-groups"],
  queryFn: () => DivisionGroupsService.listDivisionGroups(),
}

export const Route = createFileRoute("/_layout/players")({
  component: PlayersPage,
})

function PlayersPage() {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])

  const {
    data: playersData,
    isLoading: isLoadingPlayers,
    isRefetching: isRefetchingPlayers,
  } = useQuery(playersQueryOptions)

  const {
    data: divisions,
    isLoading: isLoadingDivisions,
    isRefetching: isRefetchingDivisions,
  } = useQuery(divisionsQueryOptions)

  const {
    data: divisionGroups,
    isLoading: isLoadingGroups,
    isRefetching: isRefetchingGroups,
  } = useQuery(divisionGroupsQueryOptions)

  const isLoading = isLoadingPlayers || isLoadingDivisions || isLoadingGroups

  const isRefreshing =
    isRefetchingPlayers || isRefetchingDivisions || isRefetchingGroups

  const players = playersData?.data ?? []
  const totalPlayers = playersData?.count ?? 0

  const divisionMap = useMemo(() => {
    const map = new Map<string, Division>()
    divisions?.forEach((division) => {
      map.set(division.id, division)
    })
    return map
  }, [divisions])

  const groupMap = useMemo(() => {
    const map = new Map<string, DivisionGroup>()
    divisionGroups?.forEach((group) => {
      map.set(group.id, group)
    })
    return map
  }, [divisionGroups])

  const canManagePlayers = Boolean(currentUser?.is_superuser)

  if (isLoading && players.length === 0) {
    return (
      <Container maxW="full" pt={12}>
        <Flex alignItems="center" justifyContent="space-between" mb={8}>
          <Heading size="lg">Players</Heading>
        </Flex>
        <PendingPlayers />
      </Container>
    )
  }

  if (!isLoading && totalPlayers === 0) {
    return (
      <Container maxW="full" pt={12}>
        <Flex alignItems="center" justifyContent="space-between" mb={8}>
          <Heading size="lg">Players</Heading>
          <AddPlayer
            canManagePlayers={canManagePlayers}
            divisions={divisions ?? []}
            divisionGroups={divisionGroups ?? []}
            isLoading={isLoading || isRefreshing}
          />
        </Flex>
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <FiUsers />
            </EmptyState.Indicator>
            <VStack textAlign="center">
              <EmptyState.Title>No players yet</EmptyState.Title>
              <EmptyState.Description>
                {canManagePlayers
                  ? "Add a new player to get started"
                  : "Players will appear here once they are added."}
              </EmptyState.Description>
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      </Container>
    )
  }

  return (
    <Container maxW="full" pt={12}>
      <Flex alignItems="center" justifyContent="space-between" mb={8}>
        <Heading size="lg">Players</Heading>
        <AddPlayer
          canManagePlayers={canManagePlayers}
          divisions={divisions ?? []}
          divisionGroups={divisionGroups ?? []}
          isLoading={isLoading || isRefreshing}
        />
      </Flex>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
        {players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            division={divisionMap.get(player.division_id)}
            group={player.group_id ? groupMap.get(player.group_id) : undefined}
            canManage={canManagePlayers}
            divisions={divisions ?? []}
            divisionGroups={divisionGroups ?? []}
            isRefreshing={isRefreshing}
          />
        ))}
      </SimpleGrid>
    </Container>
  )
}
